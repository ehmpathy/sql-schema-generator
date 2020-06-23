import { Client, QueryResult } from 'pg';

export interface DatabaseConnection {
  query: (args: { sql: string; values?: (string | number)[] }) => Promise<QueryResult<any>>;
  end: () => Promise<void>;
}
export const getDatabaseConnection = async (): Promise<DatabaseConnection> => {
  const client = new Client({
    // hardcoded since this is just the integration test db config; settings configured in the provisioning/.../docker.file
    host: 'localhost',
    user: 'postgres',
    password: 'a-secure-password', // its just a docker integration test db, no worries about hardcoding this
    database: 'superimportantdb',
    port: 7821,
  });
  await client.connect();
  const connection = {
    query: ({ sql, values }: { sql: string; values?: (string | number)[] }) => client.query(sql, values),
    end: () => client.end(),
  };
  return connection;
};
