import chalk from 'chalk';
import Listr from 'listr';
import { generateAndRecordEntitySchema } from './generateAndRecordEntitySchema';
import { normalizeDeclarationContents } from './normalizeDeclarationContents';
import { readDeclarationFile } from './readDeclarationFile';

/*
  1. read the entities from source file (expect to be able to parse typescript)
    - validate that each is of proper constructor
  2. generate and record resources for each schema
*/
export const generateSchema = async ({ configPath, targetDirPath }: { configPath: string, targetDirPath: string }) => {
  // 1. read the entities from source file
  const contents = await readDeclarationFile({ configPath });
  const { entities } = await normalizeDeclarationContents({ contents });

  // 2. for each entity: generate and record resources
  console.log(chalk.bold('Generating tables, upsert, and views...'));
  const tasks = entities
    .map((entity): Listr.ListrTask => ({
      title: `${chalk.bold(entity.name)}`,
      task: () => generateAndRecordEntitySchema({ entity, targetDirPath }),
    }));
  const taskSuite = new Listr(tasks);
  await taskSuite.run().catch((err) => {
    console.error(err.message);
  });
};
