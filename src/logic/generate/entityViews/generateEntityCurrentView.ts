import { Entity } from '../../../types';

/*
  SELECT
    s.id,
    s.uuid,
    s.[all static props]
    v.[all updateable props]
    s.created_at
    v.effective_at
    v.created_at as updated_at
*/

export const generateEntityCurrentView = ({ entity }: { entity: Entity }) => {
  // define basics
  const viewName = `view_${entity.name}_current`;

  // define the property names
  const staticPropertyNames = Object.entries(entity.properties)
    .filter((entry) => !entry[1].updatable)
    .map((entry) => entry[0]);
  const updateablePropertyNames = Object.entries(entity.properties)
    .filter((entry) => !!entry[1].updatable)
    .map((entry) => entry[0]);

  // if there are no updateable properties, don't return a view
  if (updateablePropertyNames.length === 0) return null;

  // define selectors
  const staticPropertySelectors = staticPropertyNames.map((name) => `s.${name}`);
  const updateablePropertySelectors = updateablePropertyNames.map((name) => `v.${name}`);

  // define the columns
  const columns = [
    's.id',
    's.uuid',
    ...staticPropertySelectors,
    ...updateablePropertySelectors,
    's.created_at',
    'v.effective_at',
    'v.created_at as updated_at',
  ].filter((column) => !!column); // only non empty coluns

  // combine the version and static logic into full upsert function
  const definition = `
CREATE VIEW \`${viewName}\` AS
  SELECT
    ${columns.join(',\n    ')}
  FROM ${entity.name} s
  JOIN ${entity.name}_cvp cvp ON s.id = cvp.${entity.name}_id
  JOIN ${entity.name}_version v ON v.id = cvp.${entity.name}_version_id;
  `.trim();
  return {
    name: viewName,
    sql: definition,
  };
};
