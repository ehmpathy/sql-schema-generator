import { Entity, ValueObject } from '../../../../domain';
import * as prop from '../../../define/defineProperty';
import { generateAndRecordEntitySchema } from './generateAndRecordEntitySchema';
import { readFile } from './utils/fileIO';

describe('generateAndRecordEntitySchema', () => {
  const targetDirPath = `${__dirname}/__test_assets__/generated`;
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
    const tableStaticSql = await readFile(
      `${targetDirPath}/tables/${address.name}.sql`,
      'utf8',
    );
    expect(tableStaticSql).toContain('CREATE TABLE');

    // check that the upsert function was created
    const upsertSql = await readFile(
      `${targetDirPath}/functions/upsert_${address.name}.sql`,
      'utf8',
    );
    expect(upsertSql).toContain('CREATE OR REPLACE FUNCTION');
  });
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
    const tableStaticSql = await readFile(
      `${targetDirPath}/tables/${user.name}.sql`,
      'utf8',
    );
    expect(tableStaticSql).toContain('CREATE TABLE');

    // check that the version table was created
    const tableVersionSql = await readFile(
      `${targetDirPath}/tables/${user.name}_version.sql`,
      'utf8',
    );
    expect(tableVersionSql).toContain('CREATE TABLE');

    // check that the current version pointer table was created
    const tableCurrentVersionPointerSql = await readFile(
      `${targetDirPath}/tables/${user.name}_cvp.sql`,
      'utf8',
    );
    expect(tableCurrentVersionPointerSql).toContain('CREATE TABLE');

    // check that the upsert function was created
    const upsertSql = await readFile(
      `${targetDirPath}/functions/upsert_${user.name}.sql`,
      'utf8',
    );
    expect(upsertSql).toContain('CREATE OR REPLACE FUNCTION');

    // check that the backfill current version pointer function was created
    const backfillCurrentVersionPointerSql = await readFile(
      `${targetDirPath}/functions/backfill_${user.name}_cvp.sql`,
      'utf8',
    );
    expect(backfillCurrentVersionPointerSql).toContain(
      'CREATE OR REPLACE FUNCTION',
    );

    // check that the _current view was created
    const viewCurrentSql = await readFile(
      `${targetDirPath}/views/view_${user.name}_current.sql`,
      'utf8',
    );
    expect(viewCurrentSql).toContain('CREATE OR REPLACE VIEW');
  });
  it('should record all resources for an updatable entity with array properties', async () => {
    const language = new ValueObject({
      name: 'language',
      properties: {
        name: prop.VARCHAR(255),
      },
    });
    const producer = new ValueObject({
      name: 'producer',
      properties: {
        name: prop.VARCHAR(255),
      },
    });
    const movie = new Entity({
      name: 'movie',
      properties: {
        name: prop.VARCHAR(255),
        producer_ids: prop.ARRAY_OF(prop.REFERENCES(producer)),
        language_ids: {
          ...prop.ARRAY_OF(prop.REFERENCES(language)),
          updatable: true, // the languages a movie is available in can change over time
        },
      },
      unique: ['name', 'producer_ids'],
    });
    await generateAndRecordEntitySchema({
      targetDirPath,
      entity: movie,
    });

    // check static table was created
    const tableStaticSql = await readFile(
      `${targetDirPath}/tables/${movie.name}.sql`,
      'utf8',
    );
    expect(tableStaticSql).toContain('CREATE TABLE');

    // check that the version table was created
    const tableVersionSql = await readFile(
      `${targetDirPath}/tables/${movie.name}_version.sql`,
      'utf8',
    );
    expect(tableVersionSql).toContain('CREATE TABLE');

    // check that the current version pointer table was created
    const tableCurrentVersionPointerSql = await readFile(
      `${targetDirPath}/tables/${movie.name}_cvp.sql`,
      'utf8',
    );
    expect(tableCurrentVersionPointerSql).toContain('CREATE TABLE');

    // check that both mapping tables were created
    const mappingTableOne = await readFile(
      `${targetDirPath}/tables/${movie.name}_to_${producer.name}.sql`,
      'utf8',
    );
    expect(mappingTableOne).toContain('CREATE TABLE');
    const mappingTableTwo = await readFile(
      `${targetDirPath}/tables/${movie.name}_version_to_${language.name}.sql`, // note: this mapping table has the _version entity reference, since the mapping is per version
      'utf8',
    );
    expect(mappingTableTwo).toContain('CREATE TABLE');

    // check that the upsert function was created
    const upsertSql = await readFile(
      `${targetDirPath}/functions/upsert_${movie.name}.sql`,
      'utf8',
    );
    expect(upsertSql).toContain('CREATE OR REPLACE FUNCTION');

    // check that the backfill current version pointer function was created
    const backfillCurrentVersionPointerSql = await readFile(
      `${targetDirPath}/functions/backfill_${movie.name}_cvp.sql`,
      'utf8',
    );
    expect(backfillCurrentVersionPointerSql).toContain(
      'CREATE OR REPLACE FUNCTION',
    );

    // check that the getFromDelimiterSplitString function was created
    const getFromDelimiterSplitStringSql = await readFile(
      `${targetDirPath}/functions/upsert_${movie.name}.sql`,
      'utf8',
    );
    expect(getFromDelimiterSplitStringSql).toContain(
      'CREATE OR REPLACE FUNCTION',
    );

    // check that the _current view was created
    const viewCurrentSql = await readFile(
      `${targetDirPath}/views/view_${movie.name}_current.sql`,
      'utf8',
    );
    expect(viewCurrentSql).toContain('CREATE OR REPLACE VIEW');
  });
});
