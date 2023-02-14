import { Command, Flags } from '@oclif/core';

import { generateSchema } from '../../logic/compose/generateSchema/generateSchema';

// eslint-disable-next-line import/no-default-export
export default class Generate extends Command {
  public static description =
    'generate sql schema for immutable and mutable entities: tables, upsert method, and views';

  public static flags = {
    help: Flags.help({ char: 'h' }),
    config: Flags.string({
      char: 'c',
      description: 'path to config file',
      required: false,
      default: 'codegen.sql.schema.yml',
    }),
  };

  public async run() {
    const { flags } = await this.parse(Generate);
    const config = flags.config;

    // get and display the plans
    const configPath =
      config.slice(0, 1) === '/' ? config : `${process.cwd()}/${config}`; // if starts with /, consider it as an absolute path
    await generateSchema({ configPath });
  }
}
