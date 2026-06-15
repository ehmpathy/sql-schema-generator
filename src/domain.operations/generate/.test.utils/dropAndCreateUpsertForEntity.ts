import { DatabaseConnection } from '../../../.test.utils/databaseConnection';
import { Entity } from '../../../domain.objects';
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
