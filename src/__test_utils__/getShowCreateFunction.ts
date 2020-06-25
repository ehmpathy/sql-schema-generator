import { normalizeCreateFunctionDdl } from '../__nonpublished_modules__/postgres-show-create-ddl/showCreateFunction/normalizeCreateFunctionDdl';
import { showCreateFunction } from '../__nonpublished_modules__/postgres-show-create-ddl/showCreateFunction/showCreateFunction';
import { DatabaseConnection } from './databaseConnection';

export const getShowCreateFunction = async ({
  func,
  dbConnection,
}: {
  func: string;
  dbConnection: DatabaseConnection;
}) => {
  const ddl = await showCreateFunction({ dbConnection, schema: 'public', func });
  return normalizeCreateFunctionDdl({ ddl })
    .replace(/public./g, '') // also, remove the schema namespace ('public' in this case)
    .trim();
};
