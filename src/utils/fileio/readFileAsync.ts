import fs from 'fs';
import util from 'util';

export const readFile = util.promisify(fs.readFile);

export const readFileAsync = ({
  filePath,
}: {
  filePath: string;
}): Promise<string> => readFile(filePath, 'utf8');
