import Generate from './generate';

describe('command', () => {
  it('should be able to generate schema for valid entities declaration', async () => {
    await Generate.run([
      '-d',
      `${__dirname}/../__test_assets__/entities.ts`,
      '-t',
      `${__dirname}/../__test_assets__/generated`,
    ]);
  });
});
