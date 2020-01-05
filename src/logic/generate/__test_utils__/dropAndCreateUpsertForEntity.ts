import { Entity } from '../../../types';
import { generateEntityUpsert } from '../entityFunctions/generateEntityUpsert';
import { DatabaseConnection } from './databaseConnection';
import { provisionGetFromDelimiterSplitStringFunction } from './provisionGetFromDelimiterSplitStringFunction';

export const dropAndCreateUpsertFunctionForEntity = async ({
  entity,
  dbConnection,
}: {
  entity: Entity;
  dbConnection: DatabaseConnection;
}) => {
  // if has array properties, provision the array access function
  if (Object.values(entity.properties).some((prop) => !!prop.array)) {
    await provisionGetFromDelimiterSplitStringFunction({ dbConnection });
  }

  // drop and create the upsert
  const { name, sql: upsertSql } = generateEntityUpsert({ entity });
  await dbConnection.query({ sql: `DROP FUNCTION IF EXISTS ${name}` });
  await dbConnection.query({ sql: upsertSql });
};
