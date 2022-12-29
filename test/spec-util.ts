import path from 'path';
import fs from 'fs';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export function loadResourceAsString(filePath: string): string {
  filePath = path.resolve(__dirname, './resources', filePath);
  return fs.readFileSync(filePath, 'utf8');
}

export function loadResourceAsJson(filePath: string): any {
  return JSON.parse(loadResourceAsString(filePath));
}