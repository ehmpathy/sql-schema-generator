import { Entity, ValueObject } from '../../../../types';
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
  it('should record all resources for a value object (i.e., non updatable entity)', async () => {
    const address = new ValueObject({
      name: 'address',
      properties: {
        street: prop.VARCHAR(255),
        suite: {
          ...prop.VARCHAR(255),
          nullable: true,
        },
        city: prop.VARCHAR(255),
        state: prop.VARCHAR(255),
        country: prop.VARCHAR(255),
      },
    });
    await generateAndRecordEntitySchema({
      targetDirPath,
      entity: address,
    });

    // check static table was created
    const tableStaticSql = await readFile(`${targetDirPath}/tables/${address.name}.sql`, 'utf8');
    expect(tableStaticSql).toContain('CREATE TABLE');

    // check that the upsert function was created
    const upsertSql = await readFile(`${targetDirPath}/functions/upsert_${address.name}.sql`, 'utf8');
    expect(upsertSql).toContain('CREATE FUNCTION');
  });
});
