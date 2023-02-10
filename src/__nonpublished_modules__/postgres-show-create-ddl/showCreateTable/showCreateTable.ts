import { DatabaseConnection } from './types';

export const showCreateTable = async ({
  dbConnection,
  schema,
  table,
}: {
  dbConnection: DatabaseConnection;
  schema: string;
  table: string;
}) => {
  // grab the ddl our function generates
  const result = await dbConnection.query({
    sql: 'SELECT public.show_create_table($1, $2) as ddl',
    values: [schema, table],
  });
  if (!result.rows)
    throw new Error(`could not find table '${schema}.${table}'`);
  return result.rows[0].ddl;
};
