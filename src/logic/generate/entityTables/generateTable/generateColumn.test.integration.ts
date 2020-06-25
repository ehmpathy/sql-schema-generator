import { normalizeCreateTableDdl } from '../../../../__nonpublished_modules__/postgres-show-create-ddl/showCreateTable/normalizeCreateTableDdl';
import { provisionShowCreateTableFunction } from '../../../../__nonpublished_modules__/postgres-show-create-ddl/showCreateTable/provisionShowCreateTableFunction';
import { showCreateTable } from '../../../../__nonpublished_modules__/postgres-show-create-ddl/showCreateTable/showCreateTable';
import { DatabaseConnection, getDatabaseConnection } from '../../../../__test_utils__/databaseConnection';
import { DataType, DataTypeName, Property } from '../../../../types';
import { prop } from '../../../define';
import { generateColumn } from './generateColumn';

/*
  we test an example of every variation against the database to ensure we are defining valid sql
*/
describe('generateColumn', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  const testColumnIsCreatable = async ({ columnSql }: { columnSql: string }) => {
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS generate_table_column_test_table;' });
    await dbConnection.query({
      sql: `
      CREATE TABLE generate_table_column_test_table (
        ${columnSql}
      )
    `,
    });
  };
  const getShowCreateNow = async () => {
    await provisionShowCreateTableFunction({ dbConnection });
    const ddl = await showCreateTable({ dbConnection, schema: 'public', table: 'generate_table_column_test_table' });
    return normalizeCreateTableDdl({ ddl });
  };
  it('can create a table with basic column definition, w/ same syntax as from SHOW CREATE TABLE', async () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
      }),
      nullable: true,
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    await testColumnIsCreatable({ columnSql: sql });
    const createTableSQL = await getShowCreateNow();
    expect(createTableSQL).toContain(sql); // should contain the exact string
  });
  it('can create a table with bigserial definition, w/ same syntax as show create table', async () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.BIGSERIAL,
      }),
    });
    const sql = generateColumn({ columnName: 'id', property });
    await testColumnIsCreatable({ columnSql: sql });
    const createTableSQL = await getShowCreateNow();
    expect(createTableSQL).toContain(sql); // should contain the exact string
  });
  it('can create a table with enum definition, w/ same syntax as from SHOW CREATE TABLE', async () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.VARCHAR,
      }),
      check: "($COLUMN_NAME IN ('option_one','option_two')",
      nullable: true,
      default: "'option_one'",
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    await testColumnIsCreatable({ columnSql: sql });
    const createTableSQL = await getShowCreateNow();
    expect(createTableSQL).toContain(sql); // should contain the exact string
  });
  describe('SHOW CREATE PARITY', () => {
    it('should be able to create nullable text type w/ same syntax as SHOW CREATE TABLE', async () => {
      // we've found this as a special case
      const property = new Property({
        type: new DataType({
          name: DataTypeName.TEXT,
        }),
        nullable: true,
      });
      const sql = generateColumn({ columnName: 'user_id', property });

      // for some reason, text type specifically does not include the DEFAULT NULL modifier in the SHOW CREATE statement, while the rest do
      expect(sql).not.toContain('DEFAULT NULL');

      await testColumnIsCreatable({ columnSql: sql });
      const createTableSQL = await getShowCreateNow();
      expect(createTableSQL).toContain(sql); // should contain the exact string
    });
    describe('exhaustive check - every property exposed in contract with helper should be creatable', () => {
      const propertiesToCheck = [
        // integers
        { name: 'SMALLINT', args: [] },
        { name: 'INT', args: [] },
        { name: 'BIGINT', args: [] },

        // serials
        { name: 'BIGSERIAL', args: [] },

        // exact numbers
        { name: 'NUMERIC', args: [5, 2] },

        // floating point
        { name: 'REAL', args: [] },
        { name: 'DOUBLE_PRECISION', args: [] },

        // binary string
        { name: 'BYTEA', args: [21] },

        // text types
        { name: 'VARCHAR', args: [21] },
        { name: 'TEXT', args: [] },
        { name: 'CHAR', args: [21] },
      ];
      propertiesToCheck.forEach((propertyKey) => {
        const testName = `should be able to create ${JSON.stringify(
          propertyKey,
        )} and result should match SHOW CREATE of db`;
        it(testName, async () => {
          const property = (prop as any)[propertyKey.name](...propertyKey.args);
          const sql = generateColumn({ columnName: 'test_column', property });
          expect(sql.toLowerCase()).toContain(propertyKey.name.toLowerCase().replace(/_/g, ' ')); // it should have the prop name in there
          await testColumnIsCreatable({ columnSql: sql });
          const createTableSQL = await getShowCreateNow();
          expect(createTableSQL).toContain(sql); // should contain the exact string
        });
      });
    });
  });
});
