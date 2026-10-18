import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Search,
  Calendar,
  Trash2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Undo2,
  Redo2,
  FileEdit,
  Check,
  Loader2,
  PlusCircle,
  MinusCircle,
  Maximize2,
  Minimize2,
  Printer,
  Download,
  CheckSquare,
  MessageSquarePlus,
  Sparkles
} from 'lucide-react';
import { Note, ConversationCard } from '../types';
import { formatNoteDate, getTodayKey, logActivity } from '../utils/srs';
import { polishNoteContent } from '../utils/gemini';
import { InsertConversationModal } from './InsertConversationModal';

const ALLOWED_TAGS = new Set([
  'P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S',
  'H2', 'H3', 'UL', 'OL', 'LI', 'BLOCKQUOTE', 'DIV',
  'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD',
  'INPUT', 'SPAN', 'LABEL'
]);

function sanitizeHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return html;
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  function clean(node: Element) {
    Array.from(node.children).forEach(child => {
      if (!ALLOWED_TAGS.has(child.tagName)) {
        clean(child);
        child.replaceWith(...Array.from(child.childNodes));
        return;
      }
      Array.from(child.attributes).forEach(attr => {
        if (child.tagName === 'INPUT' && (attr.name === 'type' || attr.name === 'checked')) return;
        if (attr.name === 'class' && (child.classList.contains('task-item') || child.classList.contains('task-text'))) return;
        child.removeAttribute(attr.name);
      });
      clean(child);
    });
  }
  clean(parsed.body);
  return parsed.body.innerHTML;
}

function getPlainText(html: string): string {
  if (typeof DOMParser === 'undefined') return '';
  const parsed = new DOMParser().parseFromString(html || '', 'text/html');
  return parsed.body.textContent || '';
}

function convertHtmlToMarkdown(title: string, date: string, html: string): string {
  if (typeof DOMParser === 'undefined') return `# ${title}\n\n${html}`;
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  let md = `# ${title || 'Catatan'}\n*Tanggal: ${date}*\n\n`;

  parsed.body.childNodes.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      if (node.textContent?.trim()) md += `${node.textContent}\n\n`;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName;
      if (tag === 'H2') md += `## ${el.textContent}\n\n`;
      else if (tag === 'H3') md += `### ${el.textContent}\n\n`;
      else if (tag === 'BLOCKQUOTE') md += `> ${el.textContent}\n\n`;
      else if (tag === 'UL') {
        el.querySelectorAll('li').forEach(li => {
          md += `- ${li.textContent}\n`;
        });
        md += '\n';
      } else if (tag === 'OL') {
        el.querySelectorAll('li').forEach((li, idx) => {
          md += `${idx + 1}. ${li.textContent}\n`;
        });
        md += '\n';
      } else if (el.classList.contains('task-item')) {
        const checkbox = el.querySelector('input[type="checkbox"]') as HTMLInputElement | null;
        const checked = checkbox?.checked ? 'x' : ' ';
        const text = el.textContent?.trim() || '';
        md += `- [${checked}] ${text}\n`;
      } else {
        md += `${el.textContent}\n\n`;
      }
    }
  });

  return md;
}

interface NotesModuleProps {
  notes: Note[];
  onNotesChange: (notes: Note[]) => void;
  onShowToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  conversationCards?: ConversationCard[];
}

export const NotesModule: React.FC<NotesModuleProps> = ({
  notes,
  onNotesChange,
  onShowToast,
  conversationCards = []
}) => {
  const [activeId, setActiveId] = useState<string | null>(() => (notes.length > 0 ? notes[0].id : null));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | 'Pribadi' | 'Belajar' | 'Kerja' | 'Ide'>('Semua');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [wordCount, setWordCount] = useState(0);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showInsertConvModal, setShowInsertConvModal] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);
  const [isInTable, setIsInTable] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  const activeNote = notes.find(n => n.id === activeId) || null;

  // Sync content into editable div when active note changes
  useEffect(() => {
    if (editorRef.current && activeNote) {
      editorRef.current.innerHTML = activeNote.content || '';
      updateWordCount();
    }
  }, [activeId]);

  const updateWordCount = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  };

  const handleCreateNote = () => {
    const today = getTodayKey();
    const newNote: Note = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: today,
      title: '',
      content: '',
      category: selectedCategory === 'Semua' ? 'Pribadi' : selectedCategory,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updated = [newNote, ...notes];
    onNotesChange(updated);
    setActiveId(newNote.id);
    logActivity('note');
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 50);
  };

  const handleDeleteNote = (id: string) => {
    if (!window.confirm('Hapus catatan ini? Tindakan ini tidak dapat dibatalkan.')) return;
    const updated = notes.filter(n => n.id !== id);
    onNotesChange(updated);
    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[0].id : null);
    }
    onShowToast('Catatan berhasil dihapus.', 'info');
  };

  const saveActiveNote = useCallback(
    (newTitle?: string, newDate?: string, newCategory?: 'Pribadi' | 'Belajar' | 'Kerja' | 'Ide') => {
      if (!activeId) return;
      if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);

      setSaveStatus('saving');
      const updatedNotes = notes.map(n => {
        if (n.id !== activeId) return n;
        const currentHtml = editorRef.current ? editorRef.current.innerHTML : n.content;
        return {
          ...n,
          title: newTitle !== undefined ? newTitle : n.title,
          date: newDate !== undefined ? newDate : n.date,
          category: newCategory !== undefined ? newCategory : n.category,
          content: sanitizeHtml(currentHtml),
          updatedAt: Date.now()
        };
      });

      onNotesChange(updatedNotes);
      setSaveStatus('saved');
    },
    [activeId, notes, onNotesChange]
  );

  const handlePolishWithAi = async () => {
    if (!activeNote || !editorRef.current || isPolishing) return;
    setIsPolishing(true);
    onShowToast('Gemini sedang merapikan tata bahasa & struktur tulisan...', 'info');
    try {
      const res = await polishNoteContent({
        title: activeNote.title,
        contentHtml: editorRef.current.innerHTML
      });
      editorRef.current.innerHTML = sanitizeHtml(res.polishedHtml);
      updateWordCount();
      saveActiveNote();
      onShowToast(`Selesai diperbaiki: ${res.summaryOfChanges}`, 'success');
    } catch (err: unknown) {
      onShowToast(err instanceof Error ? err.message : 'Gagal merapikan catatan dengan AI.', 'error');
    } finally {
      setIsPolishing(false);
    }
  };

  const scheduleSave = useCallback(() => {
    setSaveStatus('saving');
    if (saveTimeoutRef.current) window.clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = window.setTimeout(() => {
      saveActiveNote();
    }, 450);
  }, [saveActiveNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    saveActiveNote(val);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    saveActiveNote(undefined, val);
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    updateWordCount();
    scheduleSave();
  };

  const handleFormatBlock = (e: React.ChangeEvent<HTMLSelectElement>) => {
    executeCommand('formatBlock', e.target.value);
  };

  // Check if cursor is currently in a table
  const checkCursorInTable = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editorRef.current) {
      setIsInTable(false);
      return;
    }
    const range = selection.getRangeAt(0);
    savedSelectionRef.current = range.cloneRange();
    let container: Node | null = range.startContainer;
    if (container.nodeType === Node.TEXT_NODE) {
      container = container.parentElement;
    }
    const cell = (container as Element)?.closest?.('td, th');
    setIsInTable(Boolean(cell && editorRef.current.contains(cell)));
  };

  const getFocusedCell = (): HTMLTableCellElement | null => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !editorRef.current) return null;
    let container: Node | null = selection.getRangeAt(0).startContainer;
    if (container.nodeType === Node.TEXT_NODE) container = container.parentElement;
    const cell = (container as Element)?.closest?.('td, th') as HTMLTableCellElement | null;
    return cell && editorRef.current.contains(cell) ? cell : null;
  };

  const insertTable = () => {
    editorRef.current?.focus();
    if (savedSelectionRef.current) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(savedSelectionRef.current);
    }
    const rows = Math.min(20, Math.max(1, tableRows));
    const cols = Math.min(12, Math.max(1, tableCols));

    const trHtml = Array.from({ length: rows }, (_, r) => {
      const tag = r === 0 ? 'th' : 'td';
      const cells = Array.from({ length: cols }, (_, c) => {
        const text = r === 0 ? `Kolom ${c + 1}` : '<br>';
        return `<${tag}>${text}</${tag}>`;
      }).join('');
      return `<tr>${cells}</tr>`;
    }).join('');

    document.execCommand('insertHTML', false, `<table><tbody>${trHtml}</tbody></table><p><br></p>`);
    setShowTableModal(false);
    updateWordCount();
    scheduleSave();
  };

  const handleInsertChecklist = () => {
    editorRef.current?.focus();
    const taskHtml = `<div class="task-item"><input type="checkbox"><span>Tugas baru</span></div><p><br></p>`;
    document.execCommand('insertHTML', false, taskHtml);
    updateWordCount();
    scheduleSave();
  };

  const handleInsertConversation = (card: ConversationCard, format: 'blockquote' | 'table') => {
    editorRef.current?.focus();
    let insertHtml = '';
    if (format === 'blockquote') {
      insertHtml = `<blockquote><strong>"${card.sentence}"</strong><br><em>${card.translationId}</em><br><small>Situasi: ${card.situation} · Kondisi: ${card.condition}</small></blockquote><p><br></p>`;
    } else {
      insertHtml = `<table><thead><tr><th>Bahasa Inggris</th><th>Bahasa Indonesia</th><th>Konteks</th></tr></thead><tbody><tr><td><strong>${card.sentence}</strong></td><td>${card.translationId}</td><td>${card.situation} (${card.condition})</td></tr></tbody></table><p><br></p>`;
    }
    document.execCommand('insertHTML', false, insertHtml);
    updateWordCount();
    scheduleSave();
    onShowToast('Kalimat berhasil disematkan ke catatan.', 'success');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadMarkdown = () => {
    if (!activeNote) return;
    const md = convertHtmlToMarkdown(activeNote.title, activeNote.date, activeNote.content);
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const fileName = (activeNote.title.trim() || 'catatan').replace(/[^a-zA-Z0-9_\u00C0-\u017F-]/g, '_');
    a.download = `${fileName}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    onShowToast('Catatan diunduh dalam format Markdown.', 'success');
  };

  const handleAddTableRow = () => {
    const cell = getFocusedCell();
    const table = cell?.closest('table');
    const row = cell?.closest('tr');
    if (!table || !row) return;
    const colCount = Math.max(...Array.from(table.rows, r => r.cells.length));
    const newRow = document.createElement('tr');
    for (let i = 0; i < colCount; i++) {
      const td = document.createElement('td');
      td.innerHTML = '<br>';
      newRow.appendChild(td);
    }
    row.parentElement?.insertBefore(newRow, row.nextSibling);
    scheduleSave();
  };

  const handleRemoveTableRow = () => {
    const cell = getFocusedCell();
    const table = cell?.closest('table');
    const row = cell?.closest('tr');
    if (!table || !row || table.rows.length <= 1) return;
    row.remove();
    scheduleSave();
  };

  const handleAddTableCol = () => {
    const cell = getFocusedCell();
    const table = cell?.closest('table');
    if (!table || !cell) return;
    const colIndex = cell.cellIndex;
    Array.from(table.rows).forEach(r => {
      const isHeader = r.cells[colIndex]?.tagName === 'TH';
      const newCell = document.createElement(isHeader ? 'th' : 'td');
      newCell.innerHTML = isHeader ? 'Kolom' : '<br>';
      r.cells[colIndex]?.insertAdjacentElement('afterend', newCell);
    });
    scheduleSave();
  };

  const handleRemoveTableCol = () => {
    const cell = getFocusedCell();
    const table = cell?.closest('table');
    if (!table || !cell || table.rows[0].cells.length <= 1) return;
    const colIndex = cell.cellIndex;
    Array.from(table.rows).forEach(r => {
      r.cells[colIndex]?.remove();
    });
    scheduleSave();
  };

  // Filter notes
  const filteredNotes = notes.filter(n => {
    const q = searchQuery.toLowerCase();
    const categoryMatch = selectedCategory === 'Semua' || (n.category || 'Pribadi') === selectedCategory;
    const titleMatch = n.title.toLowerCase().includes(q);
    const contentMatch = getPlainText(n.content).toLowerCase().includes(q);
    return categoryMatch && (titleMatch || contentMatch);
  });

  // Group notes by date
  const groupedNotes = new Map<string, Note[]>();
  [...filteredNotes]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.updatedAt || 0) - (a.updatedAt || 0))
    .forEach(note => {
      if (!groupedNotes.has(note.date)) groupedNotes.set(note.date, []);
      groupedNotes.get(note.date)?.push(note);
    });

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[720px] transition-colors">
      {/* Sidebar: Arsip Catatan (Hidden in Zen mode) */}
      {!isZenMode && (
        <aside className="lg:col-span-4 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 flex flex-col print-hide">
          {/* Top Header of Sidebar */}
          <div className="p-4 border-b border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-slate-900 dark:text-slate-100 text-lg">Arsip Catatan</h2>
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900">
                  {notes.length}
                </span>
              </div>
              <button
                onClick={handleCreateNote}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catatan baru</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                placeholder="Cari judul atau isi catatan..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              {(['Semua', 'Pribadi', 'Belajar', 'Kerja', 'Ide'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Note List by Date Group */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[600px] lg:max-h-none">
            {groupedNotes.size === 0 ? (
              <div className="text-center py-12 px-4">
                <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-2.5">
                  <FileEdit className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {notes.length ? 'Tidak ada catatan yang cocok.' : 'Belum ada catatan.'}
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {notes.length ? 'Coba ubah kata kunci pencarian.' : 'Klik tombol "Catatan baru" untuk mulai menulis.'}
                </p>
              </div>
            ) : (
              Array.from(groupedNotes.entries()).map(([dateKey, items]) => (
                <div key={dateKey} className="space-y-1.5">
                  <div className="px-2 text-[11px] font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{formatNoteDate(dateKey, true)}</span>
                  </div>
                  <div className="space-y-1">
                    {items.map(note => {
                      const isActive = note.id === activeId;
                      const plainSnippet = getPlainText(note.content).slice(0, 75);
                      const timeString = new Date(note.updatedAt || note.createdAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit'
                      });

                      return (
                        <button
                          key={note.id}
                          onClick={() => setActiveId(note.id)}
                          className={`w-full text-left p-3 rounded-xl transition-all border ${
                            isActive
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 shadow-2xs'
                              : 'bg-white/80 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4
                              className={`text-xs font-semibold truncate ${
                                isActive ? 'text-emerald-900 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-100'
                              }`}
                            >
                              {note.title.trim() || 'Catatan tanpa judul'}
                            </h4>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">
                              {timeString}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {plainSnippet || <span className="italic text-slate-400">Kosong...</span>}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      )}

      {/* Main Content: Modern Rich Text Editor */}
      <section className={`${isZenMode ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col bg-white dark:bg-slate-900 transition-all`}>
        {activeNote ? (
          <div className="flex flex-col h-full">
            {/* Editor Top Bar: Date, Auto-Save Status, Zen Mode, Print, Markdown, Actions */}
            <div className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/40 dark:bg-slate-950/30 print-hide">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-lg shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                  <input
                    type="date"
                    value={activeNote.date}
                    onChange={handleDateChange}
                    className="bg-transparent border-0 text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                  />
                </div>

                {/* Category Dropdown */}
                <select
                  value={activeNote.category || 'Pribadi'}
                  onChange={e => saveActiveNote(undefined, undefined, e.target.value as any)}
                  className="text-xs font-semibold px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 shadow-2xs cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Pribadi">🏷️ Pribadi</option>
                  <option value="Belajar">📚 Belajar</option>
                  <option value="Kerja">💼 Kerja</option>
                  <option value="Ide">💡 Ide</option>
                </select>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 pl-1">
                  {saveStatus === 'saving' ? (
                    <span className="flex items-center gap-1 text-slate-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Menyimpan...</span>
                    </span>
                  ) : saveStatus === 'saved' ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                      <Check className="w-3 h-3" />
                      <span>Tersimpan</span>
                    </span>
                  ) : (
                    <span className="text-red-500">Gagal menyimpan</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500 tabular-nums hidden sm:inline mr-1">
                  {wordCount} kata
                </span>

                {/* AI Polish Button */}
                <button
                  type="button"
                  disabled={isPolishing}
                  onClick={handlePolishWithAi}
                  title="Periksa dan perbaiki tata bahasa dengan AI"
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors shadow-2xs disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isPolishing ? 'animate-spin text-emerald-600' : ''}`} />
                  <span className="hidden sm:inline">{isPolishing ? 'Merapikan...' : 'AI Polish'}</span>
                </button>

                {/* Zen Mode Button */}
                <button
                  type="button"
                  onClick={() => setIsZenMode(!isZenMode)}
                  title={isZenMode ? 'Keluar Mode Fokus' : 'Mode Fokus Menulis (Zen Mode)'}
                  className={`p-1.5 rounded-lg border transition-colors ${
                    isZenMode
                      ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {isZenMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>

                {/* Download Markdown */}
                <button
                  type="button"
                  onClick={handleDownloadMarkdown}
                  title="Unduh Catatan (.md)"
                  className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* Print */}
                <button
                  type="button"
                  onClick={handlePrint}
                  title="Cetak Dokumen"
                  className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                {/* Delete Note */}
                <button
                  type="button"
                  onClick={() => handleDeleteNote(activeNote.id)}
                  title="Hapus catatan"
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Hapus</span>
                </button>
              </div>
            </div>

            {/* Document Workspace */}
            <div className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto w-full flex flex-col">
              {/* Title Input */}
              <input
                ref={titleInputRef}
                type="text"
                placeholder="Judul catatan"
                value={activeNote.title}
                onChange={handleTitleChange}
                maxLength={120}
                className="w-full text-2xl sm:text-3xl font-serif font-bold text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 border-0 border-b border-transparent focus:border-slate-200 dark:focus:border-slate-700 pb-3 focus:outline-none bg-transparent transition-all mb-4"
              />

              {/* Formatting Toolbar */}
              <div className="sticky top-20 z-20 flex flex-wrap items-center gap-1 p-1.5 bg-slate-50/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-xl mb-4 shadow-xs print-hide">
                {/* Style Dropdown */}
                <select
                  onChange={handleFormatBlock}
                  className="text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="p">Teks biasa</option>
                  <option value="h2">Judul Bagian (H2)</option>
                  <option value="h3">Subjudul (H3)</option>
                </select>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Inline Formatting */}
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => executeCommand('bold')}
                  title="Tebal (Ctrl+B)"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => executeCommand('italic')}
                  title="Miring (Ctrl+I)"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => executeCommand('underline')}
                  title="Garis Bawah (Ctrl+U)"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Lists, Checklist & Blockquote */}
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => executeCommand('insertUnorderedList')}
                  title="Daftar Berpoin"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => executeCommand('insertOrderedList')}
                  title="Daftar Bernomor"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={handleInsertChecklist}
                  title="Daftar Tugas (Checklist)"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => executeCommand('formatBlock', 'blockquote')}
                  title="Kutipan"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Quote className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Insert Conversation into Note */}
                {conversationCards.length > 0 && (
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setShowInsertConvModal(true)}
                    title="Sisipkan Kalimat Percakapan"
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg transition-colors"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Sisipkan Percakapan</span>
                  </button>
                )}

                {/* Table Trigger */}
                <div className="relative">
                  <button
                    type="button"
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => {
                      checkCursorInTable();
                      setShowTableModal(!showTableModal);
                    }}
                    title="Sisipkan Tabel"
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                      showTableModal ? 'bg-emerald-600 text-white' : 'text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <TableIcon className="w-3.5 h-3.5" />
                    <span>Tabel</span>
                  </button>

                  {/* Table Insert Dropdown Popover */}
                  {showTableModal && (
                    <div className="absolute left-0 top-full mt-1.5 p-3 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-30 w-56 space-y-3">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">Sisipkan Tabel</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <label className="text-slate-600 dark:text-slate-400">
                          Baris:
                          <input
                            type="number"
                            min={1}
                            max={20}
                            value={tableRows}
                            onChange={e => setTableRows(Number(e.target.value))}
                            className="w-full mt-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                          />
                        </label>
                        <label className="text-slate-600 dark:text-slate-400">
                          Kolom:
                          <input
                            type="number"
                            min={1}
                            max={12}
                            value={tableCols}
                            onChange={e => setTableCols(Number(e.target.value))}
                            className="w-full mt-1 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100"
                          />
                        </label>
                      </div>
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <button
                          type="button"
                          onClick={() => setShowTableModal(false)}
                          className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={insertTable}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-xs"
                        >
                          Sisipkan
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Table Context Controls (Row/Column Actions) */}
                {isInTable && (
                  <div className="flex items-center gap-1 bg-emerald-50/80 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px]">
                    <button
                      type="button"
                      onClick={handleAddTableRow}
                      className="hover:underline flex items-center gap-0.5"
                    >
                      <PlusCircle className="w-3 h-3" /> Baris
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveTableRow}
                      className="hover:underline flex items-center gap-0.5 ml-1"
                    >
                      <MinusCircle className="w-3 h-3" /> Baris
                    </button>
                    <span className="text-emerald-300 dark:text-emerald-700 mx-0.5">|</span>
                    <button
                      type="button"
                      onClick={handleAddTableCol}
                      className="hover:underline flex items-center gap-0.5"
                    >
                      <PlusCircle className="w-3 h-3" /> Kolom
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveTableCol}
                      className="hover:underline flex items-center gap-0.5 ml-1"
                    >
                      <MinusCircle className="w-3 h-3" /> Kolom
                    </button>
                  </div>
                )}

                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

                {/* Undo / Redo */}
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => executeCommand('undo')}
                  title="Urungkan (Ctrl+Z)"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => executeCommand('redo')}
                  title="Ulangi (Ctrl+Y)"
                  className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Editable Document Area */}
              <div
                ref={editorRef}
                contentEditable
                role="textbox"
                aria-label="Isi catatan"
                aria-multiline="true"
                data-placeholder="Mulai menulis di sini..."
                onInput={() => {
                  updateWordCount();
                  scheduleSave();
                }}
                onKeyUp={checkCursorInTable}
                onMouseUp={checkCursorInTable}
                className="editor-doc flex-1 focus:outline-none"
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/30 dark:bg-slate-950/20">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-serif text-2xl font-bold mb-4 shadow-sm">
              N
            </div>
            <h3 className="font-serif text-xl font-bold text-slate-800 dark:text-slate-100 mb-1.5">
              Mulai dari sebuah ide
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
              Catatan kamu tersimpan otomatis dan dikelompokkan rapi berdasarkan tanggal pembuatannya.
            </p>
            <button
              onClick={handleCreateNote}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Buat Catatan Baru</span>
            </button>
          </div>
        )}
      </section>

      {/* Insert Conversation Modal */}
      <InsertConversationModal
        isOpen={showInsertConvModal}
        onClose={() => setShowInsertConvModal(false)}
        cards={conversationCards}
        onInsert={handleInsertConversation}
      />
    </div>
  );
};
