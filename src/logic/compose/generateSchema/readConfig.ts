import {
  DatabaseLanguage,
  GeneratorConfig,
} from '../../../domain/objects/GeneratorConfig';
import { UserInputError } from '../../../utils/errors/UserInputError';
import { readYmlFile } from '../../../utils/fileio/readYmlFile';
import { getDirOfPath } from '../../../utils/filepaths/getDirOfPath';

/*
  1. read the config
  2. validate the config
*/
export const readConfig = async ({
  configPath,
}: {
  configPath: string;
}): Promise<GeneratorConfig> => {
  const configDir = getDirOfPath(configPath);
  const getAbsolutePathFromRelativeToConfigPath = (relpath: string) =>
    `${configDir}/${relpath}`;

  // get the yml
  const contents = await readYmlFile({ filePath: configPath });

  // get the language and dialect
  if (!contents.language)
    throw new UserInputError({ reason: 'config.language must be defined' });
  const language = contents.language;
  if (contents.language && contents.language !== DatabaseLanguage.POSTGRES)
    throw new UserInputError({
      reason:
        'dao generator only supports postgres. please update the `language` option in your config to `postgres` to continue',
    });
  if (!contents.dialect)
    throw new UserInputError({ reason: 'config.dialect must be defined' });
  const dialect = `${contents.dialect}`; // ensure that we read it as a string, as it could be a number

  // validate the output config
  if (!contents.declarations)
    throw new UserInputError({
      reason:
        'config.declarations must specify path to the file containing declarations',
    });
  if (!contents.generates.sql?.to)
    throw new UserInputError({
      reason:
        'config.generates.sql.to must specify where to output the generated sql',
    });

  // return the results
  return new GeneratorConfig({
    language,
    dialect,
    rootDir: configDir,
    declarationsPath: getAbsolutePathFromRelativeToConfigPath(
      contents.declarations,
    ),
    targetDirPath: getAbsolutePathFromRelativeToConfigPath(
      contents.generates.sql.to,
    ),
  });
};
