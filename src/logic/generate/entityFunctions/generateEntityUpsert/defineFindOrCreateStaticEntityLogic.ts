import { Entity } from '../../../../types';
import { castPropertyToColumnName } from '../../utils/castPropertyToColumnName';
import { pickKeysFromObject } from '../../utils/pickKeysFromObject';
import { defineMappingTableInsertsForArrayProperty } from './defineMappingTableInsertsForArrayProperty';
import { castPropertyToTableColumnValueReference } from './utils/castPropertyToTableColumnValueReference';
import { castPropertyToWhereClauseConditional } from './utils/castPropertyToWhereClauseConditional';

export const defineFindOrCreateStaticEntityLogic = ({ entity }: { entity: Entity }) => {
  // define the static property names
  const staticPropertyNames = Object.entries(entity.properties)
    .filter((entry) => !entry[1].updatable)
    .map((entry) => entry[0]);

  // define the column names and the column value references for the static properties
  const staticPropertyColumnNames = staticPropertyNames.map((name) =>
    castPropertyToColumnName({ name, definition: entity.properties[name] }),
  );
  const staticPropertyColumnValueReferences = staticPropertyNames.map((name) =>
    castPropertyToTableColumnValueReference({ name, definition: entity.properties[name] }),
  );

  // define the unique static property where clauses (for finding the entity by unique values)
  const uniqueStaticPropertyNames = staticPropertyNames.filter((name) => entity.unique.includes(name));
  const uniqueStaticPropertyWhereClauseConditionals = uniqueStaticPropertyNames.map((name) =>
    castPropertyToWhereClauseConditional({ name, definition: entity.properties[name] }),
  );

  // define the array properties, for which we'll need to insert into a mapping table
  const staticArrayProperties = pickKeysFromObject({
    object: entity.properties,
    keep: (property) => !!property.array && !property.updatable,
  });
  const mappingTableInserts = Object.entries(staticArrayProperties).map(([name, definition]) =>
    defineMappingTableInsertsForArrayProperty({ name, definition, entityName: entity.name }),
  );

  // define the sql
  return `
  -- find or create the static entity
  SET v_static_id = (
    SELECT id
    FROM ${entity.name}
    WHERE 1=1
      ${uniqueStaticPropertyWhereClauseConditionals.join('\n      ')}
  );
  IF (v_static_id IS NULL) THEN -- if entity could not be found originally, create the static entity
    INSERT INTO ${entity.name}
      (uuid, ${staticPropertyColumnNames.join(', ')})
      VALUES
      (uuid(), ${staticPropertyColumnValueReferences.join(', ')});
    SET v_static_id = (
      SELECT id
      FROM ${entity.name}
      WHERE 1=1
        ${uniqueStaticPropertyWhereClauseConditionals.join('\n        ')}
    );${
      // ensure that no newlines are added if no mapping table inserts are needed
      mappingTableInserts.length ? ['', ...mappingTableInserts].join('\n\n    ') : ''
    }
  END IF;
`.trim();
};
