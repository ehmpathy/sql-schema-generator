import { Command, Flags } from '@oclif/core';

import { generateSchema } from '../../logic/compose/generateSchema/generateSchema';

// eslint-disable-next-line import/no-default-export
export default class Generate extends Command {
  public static description =
    'generate sql schema for immutable and mutable entities: tables, upsert method, and views';

  public static flags = {
    help: Flags.help({ char: 'h' }),
    declarations: Flags.string({
      char: 'd',
      description: 'path to config file, containing entity definitions',
      required: true,
      default: 'declarations.ts',
    }),
    target: Flags.string({
      char: 't',
      description: 'target directory to record generated schema into',
      required: true,
      default: 'generated',
    }),
  };

  public async run() {
    const { flags } = await this.parse(Generate);
    const config = flags.declarations!;
    const target = flags.target!;
    // get and display the plans
    const configPath =
      config.slice(0, 1) === '/' ? config : `${process.cwd()}/${config}`; // if starts with /, consider it as an absolute path
    const targetDir =
      target.slice(0, 1) === '/' ? target : `${process.cwd()}/${target}`; // if starts with /, consider it as an absolute path
    await generateSchema({ configPath, targetDirPath: targetDir });
  }
}
