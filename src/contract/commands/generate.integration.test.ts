import { generateCommand } from './generate';

describe('generateCommand', () => {
  it('should be able to generate schema for valid entities declaration', async () => {
    await generateCommand.parseAsync([
      'node',
      'generate',
      '-c',
      `${__dirname}/../.test.assets/codegen.sql.schema.yml`,
    ]);
  });
});
