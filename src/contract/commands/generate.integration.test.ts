import Generate from './generate';

describe('command', () => {
  it('should be able to generate schema for valid entities declaration', async () => {
    await Generate.run([
      '-c',
      `${__dirname}/../__test_assets__/codegen.sql.schema.yml`,
    ]);
  });
});
