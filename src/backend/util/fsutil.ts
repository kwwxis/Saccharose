import fs, { promises as fsp } from 'fs';
import path from 'path';

export async function fsExists(filePath: string): Promise<boolean> {
  return await fsp.access(filePath, fsp.constants.F_OK).then(() => true).catch(() => false);
}

export async function fsRead(filePath: string): Promise<string> {
  return await fsp.readFile(filePath, { encoding: 'utf8' });
}

export async function fsReadJson<T>(filePath: string): Promise<T> {
  return <T> (await fsp.readFile(filePath, { encoding: 'utf8' }).then(data => {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing JSON for ' + filePath);
      throw e;
    }
  }));
}

export async function fsWrite(filePath: string, content: string): Promise<void> {
  await fsp.writeFile(filePath, content, { encoding: 'utf8' });
}

export function* fsWalkSync(dir: string): Generator<string> {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* fsWalkSync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name).replace(/\\/g, '/');
    }
  }
}

export async function* fsWalkAsync(dir: string): AsyncGenerator<string> {
  const files = await fsp.readdir(dir, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) {
      yield* fsWalkAsync(path.join(dir, file.name));
    } else {
      yield path.join(dir, file.name).replace(/\\/g, '/');
    }
  }
}
