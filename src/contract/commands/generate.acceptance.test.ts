import { execSync } from 'node:child_process';
import path from 'node:path';

describe('generate command', () => {
  it('should be able to generate schema for valid entities declaration', async () => {
    const configPath = path.join(
      __dirname,
      '../.test.assets/codegen.sql.schema.acceptance.yml',
    );
    const rootDir = path.join(__dirname, '../../..');

    // run the CLI command via node against compiled dist
    // note: test:acceptance runs build first
    execSync(`./bin/run generate -c ${configPath}`, {
      cwd: rootDir,
      encoding: 'utf-8',
    });
  });
});
