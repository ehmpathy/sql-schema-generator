import chalk from 'chalk';
import Listr from 'listr';

import { generateAndRecordEntitySchema } from './generateAndRecordEntitySchema';
import { normalizeDeclarationContents } from './normalizeDeclarationContents';
import { readConfig } from './readConfig';
import { readDeclarationFile } from './readDeclarationFile';

/*
  1. read the entities from source file (expect to be able to parse typescript)
    - validate that each is of proper constructor
  2. generate and record resources for each schema
*/
export const generateSchema = async ({
  configPath,
}: {
  configPath: string;
}) => {
  // 0. read the config file
  const { declarationsPath, targetDirPath } = await readConfig({ configPath });

  // 1. read the entities from source file
  const contents = await readDeclarationFile({ declarationsPath });
  const { entities } = await normalizeDeclarationContents({ contents });

  // 2. for each entity: generate and record resources
  console.log(chalk.bold('Generating tables, upsert, and views...')); // tslint:disable-line no-console
  const tasks = entities.map(
    (entity): Listr.ListrTask => ({
      title: `${chalk.bold(entity.name)}`,
      task: () => generateAndRecordEntitySchema({ entity, targetDirPath }),
    }),
  );
  const taskSuite = new Listr(tasks);
  await taskSuite.run().catch((err) => {
    // console.error(err); // tslint:disable-line no-console ; // TODO: choose full error when debugging
    console.error(err.message); // tslint:disable-line no-console
  });
};
