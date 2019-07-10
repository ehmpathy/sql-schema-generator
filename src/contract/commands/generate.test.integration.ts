import SchemaGenerator from './generate';

describe('command', () => {
  it('should be able to generate schema for valid entities declaration', async () => {
    await SchemaGenerator.run([
      '-d', `${__dirname}/../_test_assets/entities.ts`,
      '-t', `${__dirname}/../_test_assets/generated`,
    ]);
  });
});
