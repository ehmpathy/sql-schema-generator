import { DatabaseConnection, getDatabaseConnection } from '../../../../__test_utils__/databaseConnection';
import { getShowCreateTable } from '../../../../__test_utils__/getShowCreateTable';
import { DataType, DataTypeName, Property } from '../../../../types';
import { prop } from '../../../define';
import { generateTable } from './generateTable';

/*
  we test an example of every variation against the database to ensure we are defining valid sql
*/
describe('generateTable', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  const testTableIsCreateable = async ({ createTableSql }: { createTableSql: string }) => {
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS generate_table_test CASCADE;' });
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS generate_table_test_referenced CASCADE;' });
    await dbConnection.query({
      sql: `
      CREATE TABLE generate_table_test_referenced (
        id BIGINT PRIMARY KEY
      )
    `,
    });
    await dbConnection.query({ sql: createTableSql });
  };
  const getShowCreateNow = async () => getShowCreateTable({ table: 'generate_table_test', dbConnection });
  it('can create a table with basic column definition, w/ same syntax as from SHOW CREATE TABLE', async () => {
    const pk = new Property({
      type: new DataType({
        name: DataTypeName.BIGINT,
      }),
    });
    const reference = new Property({
      type: new DataType({
        name: DataTypeName.BIGINT,
      }),
      references: 'generate_table_test_referenced',
    });
    const status = prop.ENUM(['QUEUED', 'ATTEMPTED', 'FULFILLED']);
    const createTableSql = await generateTable({
      tableName: 'generate_table_test',
      properties: { id: pk, reference_id: reference, second_reference_id: reference, status },
      unique: ['reference_id'],
    });
    await testTableIsCreateable({ createTableSql });

    // check syntax is the same as that returned by SHOW CREATE TABLE
    const createTableSqlFound = await getShowCreateNow();
    expect(createTableSqlFound).toEqual(createTableSql); // should be the exact string

    // snapshot to save an example
    expect(createTableSql).toMatchSnapshot();
  });
});
