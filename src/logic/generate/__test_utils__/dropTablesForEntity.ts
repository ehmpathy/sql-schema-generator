import { DatabaseConnection } from '../../../__test_utils__/databaseConnection';
import { Entity } from '../../../domain';
import { generateEntityTables } from '../entityTables/generateEntityTables';

export const dropTablesForEntity = async ({
  entity,
  dbConnection,
}: {
  entity: Entity;
  dbConnection: DatabaseConnection;
}) => {
  const tables = await generateEntityTables({ entity });

  // drop each mapping table
  await Promise.all(
    tables.mappings.map((mappingTable) =>
      dbConnection.query({ sql: `DROP TABLE IF EXISTS ${mappingTable.name} CASCADE;` }),
    ),
  );

  // drop the cvp table, if exists
  if (tables.currentVersionPointer) {
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.currentVersionPointer.name} CASCADE;` });
  }

  // drop the version table, if exists
  if (tables.version) {
    await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.version!.name} CASCADE;` });
  }

  // drop the static table
  await dbConnection.query({ sql: `DROP TABLE IF EXISTS ${tables.static.name} CASCADE;` });
};
