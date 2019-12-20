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
  JOIN ${entity.name}_version v ON v.${entity.name}_id = s.id
  WHERE 1=1
    AND v.effective_at = ( -- current version
      SELECT MAX(ssv.effective_at)
      FROM ${entity.name}_version ssv
      WHERE ssv.${entity.name}_id = s.id
        AND ssv.effective_at <= NOW(6) + INTERVAL 1 SECOND -- one second in the future, to thoroughly ensure that we include things effective NOW(6)
    )
    AND v.created_at = ( -- most up to date version (allows overwriting history while maintaining all records: e.g., two versions w/ same effective_at but differing created_at)
      SELECT MAX(ssv.created_at)
      FROM ${entity.name}_version ssv
      WHERE ssv.${entity.name}_id = s.id
        AND ssv.effective_at = v.effective_at
    )
  `.trim();
  return {
    name: viewName,
    sql: definition,
  };
};
