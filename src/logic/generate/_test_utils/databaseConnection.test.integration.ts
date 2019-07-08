import { getDatabaseConnection } from './databaseConnection';

describe('database', () => {
  it('should be able to execute a query', async () => {
    const dbConnection = await getDatabaseConnection();
    const results = await dbConnection.execute({ sql: 'show table status' });
    expect(results).not.toEqual(false);
    await dbConnection.end();
  });
});
