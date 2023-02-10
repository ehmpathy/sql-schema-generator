import { DatabaseConnection } from '../../../__test_utils__/databaseConnection';
import { Entity } from '../../../domain';
import { generateEntityCurrentView } from '../entityViews/generateEntityCurrentView';

export const getEntityFromCurrentView = async ({
  id,
  entity,
  dbConnection,
}: {
  id: number;
  entity: Entity;
  dbConnection: DatabaseConnection;
}) => {
  const view = generateEntityCurrentView({ entity });
  const name = view!.name;
  const results = await dbConnection.query({
    sql: `select * from ${name} where id = ${id}`,
  });
  expect(results.rows.length).toEqual(1);
  const entityData = results.rows[0];
  return entityData;
};
