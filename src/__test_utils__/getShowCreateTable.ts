import { normalizeCreateTableDdl } from '../__nonpublished_modules__/postgres-show-create-ddl/showCreateTable/normalizeCreateTableDdl';
import { provisionShowCreateTableFunction } from '../__nonpublished_modules__/postgres-show-create-ddl/showCreateTable/provisionShowCreateTableFunction';
import { showCreateTable } from '../__nonpublished_modules__/postgres-show-create-ddl/showCreateTable/showCreateTable';
import { DatabaseConnection } from './databaseConnection';

export const getShowCreateTable = async ({
  table,
  dbConnection,
}: {
  table: string;
  dbConnection: DatabaseConnection;
}) => {
  await provisionShowCreateTableFunction({ dbConnection });
  const ddl = await showCreateTable({ dbConnection, schema: 'public', table });
  return normalizeCreateTableDdl({ ddl }).replace(/public./g, ''); // also, remove the schema namespace ('public' in this case)
};
