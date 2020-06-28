import { getDatabaseConnection } from './databaseConnection';

describe('database', () => {
  it('should be able to execute a query', async () => {
    const dbConnection = await getDatabaseConnection();
    const results = await dbConnection.query({ sql: 'select true' });
    expect(results.rows.length).toEqual(1);
    await dbConnection.end();
  });
});
