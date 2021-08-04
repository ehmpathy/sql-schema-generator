import { DatabaseConnection, getDatabaseConnection } from '../../../__test_utils__/databaseConnection';
import { getShowCreateTable } from '../../../__test_utils__/getShowCreateTable';
import { Entity, ValueObject } from '../../../domain';
import * as prop from '../../define/defineProperty';
import { createTablesForEntity, dropTablesForEntity } from '../__test_utils__';
import { generateEntityTables } from './generateEntityTables';

/*
  we test an example of every variation against the database to ensure we are defining valid sql
*/
describe('generateEntityTables', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  const getShowCreateNow = async ({ tableName }: { tableName: string }) =>
    getShowCreateTable({ table: tableName, dbConnection });
  it('generates tables for a static entity, w/ same syntax as SHOW CREATE', async () => {
    const address = new Entity({
      name: 'address',
      properties: {
        street: prop.VARCHAR(255),
        city: prop.VARCHAR(255),
        country: prop.ENUM(['US', 'CA', 'MX']),
      },
      unique: ['street', 'city', 'country'],
    });
    const tables = await generateEntityTables({ entity: address });
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name};` });
    await dbConnection.query({ sql: tables.static.sql });
    expect(tables.version).toEqual(undefined);

    // check syntax is the same as that returned by SHOW CREATE TABLE
    const createStaticSql = await getShowCreateNow({ tableName: tables.static.name });
    expect(createStaticSql).toEqual(tables.static.sql); // should be the exact string
  });
  it('generates tables for a static entity that is unique on uuid, w/ same syntax as SHOW CREATE', async () => {
    const order = new Entity({
      name: 'purchase_order',
      properties: {
        value: prop.NUMERIC(5, 2),
        customer_id: prop.BIGINT(), // should be references, but to make it simple
      },
      unique: ['uuid'], // unique on uuid because same order can be placed many different times, so uuid is the only unique attribute
    });
    const tables = await generateEntityTables({ entity: order });
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name};` });
    await dbConnection.query({ sql: tables.static.sql });
    expect(tables.version).toEqual(undefined);

    // check syntax is the same as that returned by SHOW CREATE TABLE
    const createStaticSql = await getShowCreateNow({ tableName: tables.static.name });
    expect(createStaticSql).toEqual(tables.static.sql); // should be the exact string
  });
  it('generates tables for a versioned entity, w/ same syntax as SHOW CREATE', async () => {
    const contractor = new Entity({
      name: 'contractor',
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
    const tables = await generateEntityTables({ entity: contractor });
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.currentVersionPointer!.name};` });
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.version!.name};` });
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name};` });
    await dbConnection.query({ sql: tables.static.sql });
    await dbConnection.query({ sql: tables.version!.sql });
    await dbConnection.query({ sql: tables.currentVersionPointer!.sql });

    // check syntax is the same as that returned by SHOW CREATE TABLE
    const createStaticSql = await getShowCreateNow({ tableName: tables.static.name });
    expect(createStaticSql).toEqual(tables.static.sql); // should be the exact string
    const createVersionSql = await getShowCreateNow({ tableName: tables.version!.name });
    expect(createVersionSql).toEqual(tables.version!.sql); // should be the exact string
    const createCurrentVersionPointerSql = await getShowCreateNow({ tableName: tables.currentVersionPointer!.name });
    expect(createCurrentVersionPointerSql).toEqual(tables.currentVersionPointer!.sql); // should be the exact string
  });
  it('generates tables for an entity that references other entities - including by version', async () => {
    const wikiUser = new Entity({
      name: 'wiki_user',
      properties: {
        name: prop.VARCHAR(255),
        phone_number: prop.VARCHAR(255),
      },
      unique: ['phone_number'], // for this example, lets assume users cant change phone numbers
    });
    const wikiPage = new Entity({
      name: 'wiki_page',
      properties: {
        title: { ...prop.VARCHAR(255), updatable: true },
        content: { ...prop.TEXT(), updatable: true },
      },
      unique: ['uuid'], // unique on uuid as everything is updatable, so no natural keys
    });
    const wikiEdit = new Entity({
      name: 'wiki_edit',
      properties: {
        wiki_page_id: prop.REFERENCES(wikiPage),
        editor_id: prop.REFERENCES(wikiUser),
        final_text: { ...prop.VARCHAR(255), updatable: true },
        status: { ...prop.ENUM(['APPROVED', 'EDITABLE', 'REJECTED']), nullable: true, updatable: true },
        produced_wiki_page_version: { ...prop.REFERENCES_VERSION(wikiPage), nullable: true, updatable: true }, // i.e., what version it produced
      },
      unique: ['uuid'], // unique on uuid alone since the same user can edit the same page many times, so no natural keys
    });

    // provision the actual tables for the entity
    await dropTablesForEntity({ entity: wikiEdit, dbConnection });
    await dropTablesForEntity({ entity: wikiPage, dbConnection });
    await dropTablesForEntity({ entity: wikiUser, dbConnection });
    await createTablesForEntity({ entity: wikiUser, dbConnection });
    await createTablesForEntity({ entity: wikiPage, dbConnection });
    await createTablesForEntity({ entity: wikiEdit, dbConnection });

    // check syntax is the same as that returned by SHOW CREATE TABLE
    const tables = await generateEntityTables({ entity: wikiEdit });
    const createStaticTable = await getShowCreateNow({ tableName: tables.static.name });
    expect(createStaticTable).toEqual(tables.static.sql); // should be the exact string
    const createVersionTable = await getShowCreateNow({ tableName: tables.version!.name });
    expect(createVersionTable).toEqual(tables.version!.sql); // should be the exact string
  });
  it('generates tables for an entity with array properties (both updatable and static) and unique on one array, w/ the same syntax as show create', async () => {
    const photo = new ValueObject({
      name: 'photo',
      properties: {
        url: prop.VARCHAR(255),
      },
    });
    const host = new ValueObject({
      name: 'host',
      properties: {
        name: prop.VARCHAR(255),
      },
    });
    const home = new Entity({
      name: 'home',
      properties: {
        name: prop.VARCHAR(255),
        host_ids: prop.ARRAY_OF(prop.REFERENCES(host)),
        photo_ids: {
          ...prop.ARRAY_OF(prop.REFERENCES(photo)),
          updatable: true, // the photos of a home change over time
        },
      },
      unique: ['name', 'host_ids'],
    });

    // provision the actual tables for the entity
    await dropTablesForEntity({ entity: home, dbConnection });
    await dropTablesForEntity({ entity: host, dbConnection });
    await dropTablesForEntity({ entity: photo, dbConnection });
    await createTablesForEntity({ entity: photo, dbConnection });
    await createTablesForEntity({ entity: host, dbConnection });
    await createTablesForEntity({ entity: home, dbConnection });

    // check syntax is the same as that returned by SHOW CREATE TABLE, for each mapping table
    const tables = await generateEntityTables({ entity: home });
    expect(tables.mappings.length).toEqual(2); // two mapping tables, since two array properties
    const createMappingTableSqlOne = await getShowCreateNow({ tableName: tables.mappings[0]!.name });
    expect(createMappingTableSqlOne).toEqual(tables.mappings[0]!.sql); // should be the exact string
    const createMappingTableSqlTwo = await getShowCreateNow({ tableName: tables.mappings[1]!.name });
    expect(createMappingTableSqlTwo).toEqual(tables.mappings[1]!.sql); // should be the exact string

    // record a snapshot to confirm aesthetic acceptability
    expect(tables).toMatchSnapshot();
  });
});
