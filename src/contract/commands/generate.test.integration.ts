import SchemaGenerator from './generate';

describe('command', () => {
  it('should be able to generate schema for valid entities declaration', async () => {
    await SchemaGenerator.run([
      '-d',
      `${__dirname}/../__test_assets__/entities.ts`,
      '-t',
      `${__dirname}/../__test_assets__/generated`,
    ]);
  });
});
