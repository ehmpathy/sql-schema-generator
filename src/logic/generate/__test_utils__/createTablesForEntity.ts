import { Entity } from '../../../types';
import { generateEntityTables } from '../entityTables/generateEntityTables';
import { DatabaseConnection } from './databaseConnection';

export const createTablesForEntity = async ({
  entity,
  dbConnection,
}: {
  entity: Entity;
  dbConnection: DatabaseConnection;
}) => {
  const tables = await generateEntityTables({ entity });

  // create the static table
  await dbConnection.query({ sql: tables.static.sql });

  // drop the version table, if exists
  if (tables.version) {
    await dbConnection.query({ sql: tables.version.sql });
  }

  // drop the cvp table, if exists
  if (tables.currentVersionPointer) {
    await dbConnection.query({ sql: tables.currentVersionPointer.sql });
  }

  // create each mapping table
  await Promise.all(tables.mappings.map((mappingTable) => dbConnection.query({ sql: mappingTable.sql })));
};
