import { DatabaseConnection, getDatabaseConnection } from '../../__test_utils__/databaseConnection';
import { normalizeCreateTableDdl } from './normalizeCreateTableDdl';
import { provisionShowCreateTableFunction } from './provisionShowCreateTableFunction';
import { showCreateTable } from './showCreateTable';

describe('showCreateTable', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });
  it('should be possible to get create statement of table', async () => {
    await provisionShowCreateTableFunction({ dbConnection });
    await dbConnection.query({ sql: 'DROP TABLE IF EXISTS test_tb_for_show_create_on;' });
    await dbConnection.query({
      sql: `
CREATE TABLE test_tb_for_show_create_on (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(150),
  level VARCHAR(50) CHECK (level IN ('info', 'warn', 'error')) DEFAULT 'info',
  description TEXT NOT NULL
)
    `.trim(),
    });
    const ddl = await showCreateTable({ dbConnection, schema: 'public', table: 'test_tb_for_show_create_on' });
    const normalizedDdl = await normalizeCreateTableDdl({ ddl });
    expect(normalizedDdl).toMatchSnapshot();
  });
});
