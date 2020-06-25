import pg, { Client, QueryResult } from 'pg';

// https://github.com/brianc/node-postgres/pull/353#issuecomment-283709264
pg.types.setTypeParser(20, (value) => parseInt(value, 10)); // cast bigints to numbers; by default, pg returns bigints as strings, since max val of bigint is bigger than max safe value in js

export interface DatabaseConnection {
  query: (args: { sql?: string; text?: string; values?: (string | number)[] }) => Promise<QueryResult<any>>;
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
    query: ({ sql, text, values }: { sql?: string; text?: string; values?: (string | number)[] }) => {
      if (!sql && !text) throw new Error('either sql or text must be defined');
      return client.query(sql || text!, values);
    },
    end: () => client.end(),
  };
  return connection;
};
