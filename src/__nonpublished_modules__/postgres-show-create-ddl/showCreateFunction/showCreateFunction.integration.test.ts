import {
  DatabaseConnection,
  getDatabaseConnection,
} from '../../../__test_utils__/databaseConnection';
import { showCreateFunction } from './showCreateFunction';

describe('showCreateFunction', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  it('should be possible to get create statement of function', async () => {
    await dbConnection.query({
      sql: 'DROP FUNCTION IF EXISTS test_func_for_show_create_on;',
    });
    await dbConnection.query({
      sql: `
CREATE FUNCTION test_func_for_show_create_on (
  in_name varchar
)
RETURNS int
LANGUAGE plpgsql VOLATILE
AS
$$
  DECLARE
    v_test_int int := 821;
  BEGIN
    RETURN v_test_int;
  END;
$$
      `.trim(),
    });
    const result = await showCreateFunction({
      dbConnection,
      schema: 'public',
      func: 'test_func_for_show_create_on',
    });
    expect(result).toMatchSnapshot();
  });
});
