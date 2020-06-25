import { DatabaseConnection, getDatabaseConnection } from '../../../../__test_utils__/databaseConnection';
import { getShowCreateTable } from '../../../../__test_utils__/getShowCreateTable';
import { DataType, DataTypeName, Property } from '../../../../types';
import { generateColumn } from './generateColumn';
import { generateConstraintForeignKey } from './generateConstraintForeignKey';

/*
  we test an example of every variation against the database to ensure we are defining valid sql
*/
describe('generateConstraintForeignKey', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  const testFkIsCreateable = async ({
    columnSql,
    constraintSql,
    indexSql,
  }: {
    columnSql: string;
    constraintSql: string;
    indexSql: string;
  }) => {
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS generate_table_constraint_fk_test;' });
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS generate_table_constraint_fk_test_referenced;' });
    await dbConnection.query({
      sql: `
      CREATE TABLE generate_table_constraint_fk_test_referenced (
        id BIGINT PRIMARY KEY
      )
    `,
    });
    await dbConnection.query({
      sql: `
      CREATE TABLE generate_table_constraint_fk_test (
        ${columnSql} PRIMARY KEY,
        ${constraintSql}
      );
      ${indexSql};
    `,
    });
  };
  const getShowCreateNow = async () => getShowCreateTable({ table: 'generate_table_constraint_fk_test', dbConnection });
  const property = new Property({
    type: new DataType({
      name: DataTypeName.BIGINT,
    }),
    references: 'generate_table_constraint_fk_test_referenced',
  });
  it('can create a table with basic column definition, w/ same syntax as from SHOW CREATE TABLE', async () => {
    const columnSql = generateColumn({ columnName: 'user_id', property });
    const constraintSql = generateConstraintForeignKey({
      index: 1,
      tableName: 'generate_table_constraint_fk_test',
      columnName: 'user_id',
      property,
    });
    await testFkIsCreateable({ columnSql, constraintSql: constraintSql.constraint, indexSql: constraintSql.index });

    // check syntax is the same as that returned by SHOW CREATE TABLE
    const createTableSQL = await getShowCreateNow();
    expect(createTableSQL).toContain(constraintSql.constraint); // should contain the exact string
    expect(createTableSQL).toContain(constraintSql.index); // should contain the exact string
  });
});
