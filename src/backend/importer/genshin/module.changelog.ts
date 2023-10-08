export interface ChangelogRecord {
  key: number,
  excelFile: string,
  changeType: 'added' | 'updated' | 'removed',
  changes: {
    field: string,
    oldValue: string,
    newValue: string,
  }[]
}


export async function createChangelog(currentVersion: string) {

}