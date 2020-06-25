import { DatabaseConnection } from '../../../__test_utils__/databaseConnection';
import { Entity } from '../../../types';
import { generateEntityUpsert } from '../entityFunctions/generateEntityUpsert';

export const dropAndCreateUpsertFunctionForEntity = async ({
  entity,
  dbConnection,
}: {
  entity: Entity;
  dbConnection: DatabaseConnection;
}) => {
  const { name, sql: upsertSql } = generateEntityUpsert({ entity });
  await dbConnection.query({ sql: `DROP FUNCTION IF EXISTS ${name}` });
  await dbConnection.query({ sql: upsertSql });
};
