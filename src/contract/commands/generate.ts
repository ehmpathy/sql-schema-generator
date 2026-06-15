import { Command } from 'commander';

import { generateSchema } from '@src/domain.operations/compose/generateSchema/generateSchema';

export const generateCommand = new Command('generate')
  .description(
    'generate sql schema for immutable and mutable entities: tables, upsert method, and views',
  )
  .option(
    '-c, --config <path>',
    'path to config file',
    'codegen.sql.schema.yml',
  )
  .action(async (options: { config: string }) => {
    const config = options.config;
    const configPath =
      config.slice(0, 1) === '/' ? config : `${process.cwd()}/${config}`;
    await generateSchema({ configPath });
  });
