import indentString from 'indent-string';

import { Entity } from '../../../domain';
import { castPropertyToSelector } from './utils/castPropertyToSelector';

/*
  SELECT
    s.id,
    s.uuid,
    s.[all static props] (concat_ws all array props)
    v.[all updateable props] (concat_ws all array props)
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
  const arrayPropertyNames = Object.entries(entity.properties)
    .filter((entry) => !!entry[1].array)
    .map((entry) => entry[0]);

  // if there are no updateable properties and no array properties, don't return a view - it would just be a replica of the static table
  const hasVersionTable = !!updateablePropertyNames.length;
  const hasArrayProperties = !!arrayPropertyNames.length;
  if (!hasVersionTable && !hasArrayProperties) return null;

  // define selectors
  const staticPropertySelectors = staticPropertyNames.map((name) =>
    castPropertyToSelector({
      entityName: entity.name,
      name,
      definition: entity.properties[name],
    }),
  );
  const updateablePropertySelectors = updateablePropertyNames.map((name) =>
    castPropertyToSelector({
      entityName: entity.name,
      name,
      definition: entity.properties[name],
    }),
  );

  // define the columns
  const columns = [
    's.id',
    's.uuid',
    ...staticPropertySelectors,
    ...updateablePropertySelectors,
    's.created_at',
    hasVersionTable ? 'v.effective_at' : null,
    hasVersionTable ? 'v.created_at as updated_at' : null,
  ].filter((column) => !!column); // only non empty columns

  // define the joins
  const joins = hasVersionTable // only join if has version table
    ? [
        '',
        `JOIN ${entity.name}_cvp cvp ON s.id = cvp.${entity.name}_id`,
        `JOIN ${entity.name}_version v ON v.id = cvp.${entity.name}_version_id`,
      ]
    : [];

  // combine the version and static logic into full upsert function
  const definition = `
CREATE OR REPLACE VIEW ${viewName} AS
  SELECT
    ${indentString(columns.join(',\n'), 4).trim()}
  FROM ${entity.name} s${joins.join('\n  ')};
  `.trim();
  return {
    name: viewName,
    sql: definition,
  };
};
