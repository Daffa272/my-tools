import React from 'react';

type ProjectId = 'kbbi' | 'listening' | 'note' | 'object' | 'pauli' | 'vocab';

const projects: { id: ProjectId; label: string }[] = [
  { id: 'kbbi', label: 'KBBI' },
  { id: 'listening', label: 'Listening' },
  { id: 'note', label: 'Catatan' },
  { id: 'object', label: 'Benda' },
  { id: 'pauli', label: 'Tes Pauli' },
  { id: 'vocab', label: 'Vocabulary' },
];

const devPorts: Record<ProjectId, number> = {
  kbbi: 3001,
  listening: 3002,
  note: 3003,
  object: 3004,
  pauli: 3005,
  vocab: 3006,
};

export function ProjectMenu({ activeApp }: { activeApp: ProjectId }) {
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  const projectHref = (id: ProjectId) =>
    isLocal ? `http://${window.location.hostname}:${devPorts[id]}/` : `../${id}/`;
  const homeHref = isLocal ? 'http://localhost:3100/' : '../';

  return (
    <nav
      aria-label="Menu aplikasi belajar"
      className="relative z-50 w-full border-b border-slate-200 bg-white px-3 py-2 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <a
          href={homeHref}
          className="shrink-0 text-sm font-bold tracking-tight text-slate-900 dark:text-white"
        >
          English Hub
        </a>
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto sm:justify-end">
          {projects.map((project) =>
            project.id === activeApp ? (
              <span
                key={project.id}
                aria-current="page"
                className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white"
              >
                {project.label}
              </span>
            ) : (
              <a
                key={project.id}
                href={projectHref(project.id)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
              >
                {project.label}
              </a>
            )
          )}
        </div>
      </div>
    </nav>
  );
}
