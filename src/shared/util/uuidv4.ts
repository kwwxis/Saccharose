/**
 * Generate new GUID.
 * @returns {string}
 */
export function uuidv4(): string {
  return (`${1e7}-${1e3}-${4e3}-${8e3}-${1e11}`).replace(/[018]/g, (c: any) =>
    (c ^ global.crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16),
  );
}

export const NIL_UUID = `0000000-0000-0000-0000-000000000000`;

export const MAX_UUID = `ffffffff-ffff-ffff-ffff-ffffffffffff`;
