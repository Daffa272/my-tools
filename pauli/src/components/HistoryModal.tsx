import React from 'react';
import { X, Trash2, Calendar, Award } from 'lucide-react';
import { TestRecord } from '../types';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: TestRecord[];
  onSelectRecord: (record: TestRecord) => void;
  onDeleteRecord: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectRecord,
  onDeleteRecord,
  onClearAll,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[85vh] overflow-hidden bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Riwayat Latihan Psikotes</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tercatat {history.length} simulasi yang tersimpan di perangkat ini
            </p>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Hapus seluruh catatan riwayat simulasi?')) {
                    onClearAll();
                  }
                }}
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-6 overflow-y-auto flex-1">
          {history.length === 0 ? (
            <div className="py-16 text-center">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="font-semibold text-slate-700 text-sm">Belum Ada Riwayat Latihan</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
                Selesaikan minimal satu sesi tes simulasi untuk melihat perkembangan dan kurva kerja Anda di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.config.name || 'Peserta'}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700">
                        {item.config.testType === 'pauli' ? 'Tes Pauli' : 'Tes Kraepelin'}
                      </span>
                      <span className="text-xs text-slate-500">·</span>
                      <span className="text-xs text-slate-500">{item.sessionResults.length} Sesi</span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{item.date}</span>
                      <span>·</span>
                      <span>
                        Terjawab: <strong className="text-slate-800">{item.analysis.totalAnswered}</strong>
                      </span>
                      <span>·</span>
                      <span>
                        Akurasi: <strong className="text-emerald-700">{item.analysis.totalAccuracy}%</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-indigo-900 mt-1">
                      <Award className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="font-medium">{item.analysis.overallGrade}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      onClick={() => onSelectRecord(item)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Buka Hasil
                    </button>
                    <button
                      onClick={() => onDeleteRecord(item.id)}
                      title="Hapus rekaman ini"
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
