import indentString from 'indent-string';

import { Entity } from '../../../../types';
import { castPropertyToColumnName } from '../../utils/castPropertyToColumnName';
import { pickKeysFromObject } from '../../utils/pickKeysFromObject';
import { defineMappingTableInsertsForArrayProperty } from './defineMappingTableInsertsForArrayProperty';
import { castPropertyToTableColumnValueReference } from './utils/castPropertyToTableColumnValueReference';
import { castPropertyToWhereClauseConditional } from './utils/castPropertyToWhereClauseConditional';

export const defineInsertVersionIfDynamicDataChangedLogic = ({ entity }: { entity: Entity }) => {
  // define the updatable property names
  const updatablePropertyNames = Object.entries(entity.properties)
    .filter((entry) => !!entry[1].updatable)
    .map((entry) => entry[0]);

  // if no updatable properties - nothing to do here! its not a versioned entity
  if (updatablePropertyNames.length === 0) return null;

  // define the column names and the column value references for the updatable properties
  const updatablePropertyColumnNames = updatablePropertyNames.map((name) =>
    castPropertyToColumnName({ name, definition: entity.properties[name] }),
  );
  const updatablePropertyColumnValueReferences = updatablePropertyNames.map((name) =>
    castPropertyToTableColumnValueReference({ name, definition: entity.properties[name] }),
  );

  // define the where clause conditionals for the updatable properties
  const updateablePropertyWhereClauseConditionals = updatablePropertyNames.map((name) =>
    castPropertyToWhereClauseConditional({ name, definition: entity.properties[name] }),
  );

  // define the array properties, for which we'll need to insert into a mapping table
  const updatableArrayProperties = pickKeysFromObject({
    object: entity.properties,
    keep: (property) => !!property.array && !!property.updatable,
  });
  const mappingTableInserts = Object.entries(updatableArrayProperties).map(([name, definition]) =>
    defineMappingTableInsertsForArrayProperty({ name, definition, entityName: entity.name }),
  );

  // return the sql
  return `
  -- insert new version to ensure that latest dynamic data is effective, if dynamic data has changed
  SET v_matching_version_id = ( -- see if latest version already has this data
    SELECT id
    FROM ${entity.name}_version
    WHERE 1=1
      AND ${entity.name}_id = v_static_id -- for this entity
      AND effective_at = ( -- and is the currently effective version
        SELECT MAX(effective_at)
        FROM ${entity.name}_version ssv
        WHERE ssv.${entity.name}_id = v_static_id
      )
      ${indentString(updateablePropertyWhereClauseConditionals.join('\n'), 6).trim()}
  );
  IF (v_matching_version_id IS NULL) THEN -- if the latest version does not match, insert a new version
    INSERT INTO ${entity.name}_version
      (${entity.name}_id, ${updatablePropertyColumnNames.join(', ')})
      VALUES
      (v_static_id, ${updatablePropertyColumnValueReferences.join(', ')});
    SET v_matching_version_id = (
      SELECT last_insert_id()
    );${
      // ensure that no newlines are added if no mapping table inserts are needed
      mappingTableInserts.length ? ['', ...mappingTableInserts].join('\n\n    ') : ''
    }
  END IF;
`.trim();
};
