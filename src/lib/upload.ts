import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomBytes } from 'crypto';

const MAX_BYTES = 4.5 * 1024 * 1024;
const ALLOWED: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export async function saveUploadedImage(
  file: File | null | undefined,
  folder: string,
  options?: { maxBytes?: number }
) {
  if (!file || typeof file === 'string' || file.size === 0) return null;
  const ext = ALLOWED[file.type];
  if (!ext) throw new Error('Usá JPG, PNG, WebP o GIF.');
  const maxBytes = options?.maxBytes ?? MAX_BYTES;
  const maxMb = Math.round(maxBytes / (1024 * 1024));
  if (file.size > maxBytes) throw new Error(`La imagen no puede pesar más de ${maxMb} MB.`);
  const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads', folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return `/uploads/${folder}/${name}`;
}
