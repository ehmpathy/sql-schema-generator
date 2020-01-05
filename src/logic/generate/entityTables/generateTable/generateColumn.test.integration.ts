import { prop } from '../../../../contract/module';
import { DataType, DataTypeName, Property } from '../../../../types';
import { DatabaseConnection, getDatabaseConnection } from '../../__test_utils__/databaseConnection';
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
      ) DEFAULT CHARSET=utf8 COLLATE=utf8_bin
    `,
    });
  };
  const getShowCreateNow = async () => {
    const result = (await dbConnection.query({ sql: 'SHOW CREATE TABLE generate_table_column_test_table' })) as any;
    return result[0][0]['Create Table'];
  };
  it('can create a table with basic column definition, w/ same syntax as from SHOW CREATE TABLE', async () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.INT,
        precision: 11,
      }),
      comment: 'hope this clarifies things for ya',
      nullable: true,
    });
    const sql = generateColumn({ columnName: 'user_id', property });
    await testColumnIsCreatable({ columnSql: sql });
    const createTableSQL = await getShowCreateNow();
    expect(createTableSQL).toContain(sql); // should contain the exact string
  });
  it('can create a table with enum definition, w/ same syntax as from SHOW CREATE TABLE', async () => {
    const property = new Property({
      type: new DataType({
        name: DataTypeName.ENUM,
        values: ['option_one', 'option_two'],
      }),
      comment: 'hope this clarifies things for ya',
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
        { name: 'TINYINT', args: [] },
        { name: 'SMALLINT', args: [] },
        { name: 'MEDIUMINT', args: [] },
        { name: 'INT', args: [] },
        { name: 'BIGINT', args: [] },

        // exact numbers
        { name: 'DECIMAL', args: [5, 2] },

        // floating point
        { name: 'FLOAT', args: [] },
        { name: 'DOUBLE', args: [] },

        // bit type
        { name: 'BIT', args: [8] },

        // text types
        { name: 'ENUM', args: [['a', 'b', 'c', 'd', 'f']] },
        { name: 'BINARY', args: [21] },
        { name: 'CHAR', args: [21] },
        { name: 'VARCHAR', args: [21] },
        { name: 'TINYTEXT', args: [] },
        { name: 'TEXT', args: [] },
        { name: 'MEDIUMTEXT', args: [] },
        { name: 'LONGTEXT', args: [] },
      ];
      propertiesToCheck.forEach((propertyKey) => {
        const testName = `should be able to create ${JSON.stringify(
          propertyKey,
        )} and result should match SHOW CREATE of db`;
        it(testName, async () => {
          const property = (prop as any)[propertyKey.name](...propertyKey.args);
          const sql = generateColumn({ columnName: 'test_column', property });
          expect(sql.toLowerCase()).toContain(propertyKey.name.toLowerCase()); // it should have the prop name in there
          await testColumnIsCreatable({ columnSql: sql });
          const createTableSQL = await getShowCreateNow();
          expect(createTableSQL).toContain(sql); // should contain the exact string
        });
      });
    });
  });
});
