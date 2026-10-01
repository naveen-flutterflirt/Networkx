import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

const staleFiles = [
  'public/courses.html',
  'public/data-deletion.html',
  'public/legacy/index.html',
];

let removed = 0;
for (const rel of staleFiles) {
  const target = path.join(root, rel);
  if (!fs.existsSync(target)) continue;
  fs.rmSync(target, { force: true });
  removed += 1;
  console.log(`[cleanup] removed stale file: ${rel}`);
}

if (removed === 0) {
  console.log('[cleanup] no stale conflicting public HTML files found');
}
