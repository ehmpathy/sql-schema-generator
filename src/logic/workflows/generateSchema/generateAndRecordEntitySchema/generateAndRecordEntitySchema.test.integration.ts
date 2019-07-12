import { Entity } from '../../../../types';
import * as prop from '../../../define/defineProperty';
import { readFile } from './_utils/fileIO';
import { generateAndRecordEntitySchema } from './generateAndRecordEntitySchema';

describe('generateAndRecordEntitySchema', () => {
  const targetDirPath = `${__dirname}/_test_assets/generated`;
  it('should record all resources for an updatable entity', async () => {
    const user = new Entity({
      name: 'user',
      properties: {
        cognito_uuid: prop.UUID(),
        name: {
          ...prop.VARCHAR(255),
          updatable: true,
        },
        bio: {
          ...prop.TEXT(),
          updatable: true,
          nullable: true,
        },
      },
      unique: ['cognito_uuid'],
    });
    await generateAndRecordEntitySchema({
      targetDirPath,
      entity: user,
    });

    // check static table was created
    const tableStaticSql = await readFile(`${targetDirPath}/tables/${user.name}.sql`, 'utf8');
    expect(tableStaticSql).toContain('CREATE TABLE');

    // check that the version table was created
    const tableVersionSql = await readFile(`${targetDirPath}/tables/${user.name}_version.sql`, 'utf8');
    expect(tableVersionSql).toContain('CREATE TABLE');

    // check that the upsert function was created
    const upsertSql = await readFile(`${targetDirPath}/functions/upsert_${user.name}.sql`, 'utf8');
    expect(upsertSql).toContain('CREATE FUNCTION');

    // check that the _current view was created
    const viewCurrentSql = await readFile(`${targetDirPath}/views/view_${user.name}_current.sql`, 'utf8');
    expect(viewCurrentSql).toContain('CREATE VIEW');
  });
});
