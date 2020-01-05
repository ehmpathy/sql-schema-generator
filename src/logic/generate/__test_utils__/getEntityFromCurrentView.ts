import { Entity } from '../../../types';
import { generateEntityCurrentView } from '../entityViews/generateEntityCurrentView';
import { DatabaseConnection } from './databaseConnection';

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
  const results = (await dbConnection.execute({ sql: `select * from ${name} where id = ${id}` })) as any;
  expect(results[0].length).toEqual(1);
  const entityData = results[0][0];
  return entityData;
};
