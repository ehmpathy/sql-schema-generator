import fs from 'fs';
import util from 'util';

// export these from a separate file to make testing easier (i.e., easier to define the mocks)
const mkdir = util.promisify(fs.mkdir);

export const makeDirectoryAsync = async ({
  directoryPath,
}: {
  directoryPath: string;
}) => mkdir(directoryPath, { recursive: true });
