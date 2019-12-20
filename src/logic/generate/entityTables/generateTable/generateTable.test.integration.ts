import { DataType, DataTypeName, Property } from '../../../../types';
import { DatabaseConnection, getDatabaseConnection } from '../../_test_utils/databaseConnection';
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
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS generate_table_test;' });
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS generate_table_test_referenced;' });
    await dbConnection.query({
      sql: `
      CREATE TABLE generate_table_test_referenced (
        id BIGINT PRIMARY KEY
      )
    `,
    });
    await dbConnection.query({ sql: createTableSql });
  };
  const getShowCreateNow = async () => {
    const result = (await dbConnection.query({ sql: 'SHOW CREATE TABLE generate_table_test' })) as any;
    return result[0][0]['Create Table'];
  };
  it('can create a table with basic column definition, w/ same syntax as from SHOW CREATE TABLE', async () => {
    const pk = new Property({
      type: new DataType({
        name: DataTypeName.BIGINT,
        precision: 11,
      }),
    });
    const reference = new Property({
      type: new DataType({
        name: DataTypeName.BIGINT,
        precision: 11,
      }),
      references: 'generate_table_test_referenced',
    });
    const createTableSql = await generateTable({
      tableName: 'generate_table_test',
      properties: { id: pk, reference_id: reference, second_reference_id: reference },
      unique: ['reference_id'],
    });
    await testTableIsCreateable({ createTableSql });

    // check syntax is the same as that returned by SHOW CREATE TABLE
    const createTableSqlFound = await getShowCreateNow();
    expect(createTableSqlFound).toEqual(createTableSql); // should be the exact string
  });
});
