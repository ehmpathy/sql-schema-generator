import { DatabaseConnection } from '../../../__test_utils__/databaseConnection';
import { Entity } from '../../../types';
import { generateEntityCurrentView } from '../entityViews/generateEntityCurrentView';

export const dropAndCreateViewForEntity = async ({
  entity,
  dbConnection,
}: {
  entity: Entity;
  dbConnection: DatabaseConnection;
}) => {
  const { name, sql: upsertSql } = generateEntityCurrentView({ entity })!;
  await dbConnection.query({ sql: `DROP VIEW IF EXISTS ${name}` });
  await dbConnection.query({ sql: upsertSql });
  return { name, sql: upsertSql };
};
