import mysql, { Connection, ConnectionOptions } from 'mysql2/promise';

export const getDatabaseConnection = async (): Promise<Connection> => {
  const dbConfig: ConnectionOptions = { // hardocded since this is just the integration test db config; settings configured in the provisioning/.../docker.file
    host: 'localhost',
    user: 'root',
    password: 'a-secure-password', // its just a docker integration test db, no worries about hardcoding this
    database: 'superimportantdb',
    port: 12821,
  };
  const connection = await mysql.createConnection(dbConfig);
  return connection;
};

export { Connection as DatabaseConnection };
