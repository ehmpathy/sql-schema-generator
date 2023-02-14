export const getDirOfPath = (path: string) =>
  path.split('/').slice(0, -1).join('/'); // drops the file name
