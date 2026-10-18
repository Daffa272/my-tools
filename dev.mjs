import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const apps = [
  { name: 'KBBI', folder: 'kbbi', port: 3001, command: 'vite' },
  { name: 'Listening', folder: 'listening', port: 3002, command: 'vite' },
  { name: 'Catatan', folder: 'note', port: 3003, command: 'vite' },
  { name: 'Benda', folder: 'object', port: 3004, command: 'tsx' },
  { name: 'Tes Pauli', folder: 'pauli', port: 3005, command: 'vite' },
  { name: 'Vocabulary', folder: 'vocab', port: 3006, command: 'vite' },
];

const children = [];
let shuttingDown = false;

for (const app of apps) {
  const executable = app.command === 'vite'
    ? path.join(root, app.folder, 'node_modules', 'vite', 'bin', 'vite.js')
    : path.join(root, app.folder, 'node_modules', 'tsx', 'dist', 'cli.mjs');

  if (!existsSync(executable)) {
    throw new Error(`Dependensi ${app.command} belum tersedia di folder ${app.folder}.`);
  }

  const args = app.command === 'vite'
    ? [executable, '--host', '0.0.0.0', '--port', String(app.port), '--strictPort']
    : [executable, 'server.ts'];
  const child = spawn(process.execPath, args, {
    cwd: path.join(root, app.folder),
    env: { ...process.env, ...(app.command === 'tsx' ? { PORT: String(app.port) } : {}) },
    stdio: 'inherit',
  });

  child.on('error', (error) => {
    console.error(`Gagal menjalankan ${app.name}:`, error);
  });
  child.on('exit', (code) => {
    if (!shuttingDown) {
      console.error(`${app.name} berhenti (exit code ${code ?? 'unknown'}).`);
    }
  });
  children.push(child);
  console.log(`${app.name}: http://localhost:${app.port}/`);
}

const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  response.end(readFileSync(path.join(root, 'index.html')));
});

server.listen(3100, '0.0.0.0', () => {
  console.log('English Hub: http://localhost:3100/');
});

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  server.close();
  for (const child of children) {
    child.kill();
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
