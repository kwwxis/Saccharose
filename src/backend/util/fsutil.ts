import { promises as fsp } from 'fs';

export async function fsExists(filePath: string): Promise<boolean> {
  return await fsp.access(filePath, fsp.constants.F_OK).then(() => true).catch(() => false);
}

export async function fsRead(filePath: string): Promise<string> {
  return await fsp.readFile(filePath, { encoding: 'utf8' });
}

export async function fsReadJson<T>(filePath: string): Promise<T> {
  return <T> (await fsp.readFile(filePath, { encoding: 'utf8' }).then(data => JSON.parse(data)));
}

export async function fsWrite(filePath: string, content: string): Promise<void> {
  await fsp.writeFile(filePath, content, { encoding: 'utf8' });
}
