import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export function dataPath(filename: string) {
  return path.join(DATA_DIR, filename);
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  await ensureDataDir();
  const fullPath = dataPath(filename);
  try {
    const raw = await fs.readFile(fullPath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (e: any) {
    if (e?.code === 'ENOENT') return fallback;
    // corrupted json -> keep service alive with fallback
    return fallback;
  }
}

export async function writeJsonFile<T>(filename: string, data: T): Promise<void> {
  await ensureDataDir();
  const fullPath = dataPath(filename);
  const tmpPath = `${fullPath}.tmp`;
  const payload = JSON.stringify(data, null, 2);
  await fs.writeFile(tmpPath, payload, 'utf8');
  await fs.rename(tmpPath, fullPath);
}

