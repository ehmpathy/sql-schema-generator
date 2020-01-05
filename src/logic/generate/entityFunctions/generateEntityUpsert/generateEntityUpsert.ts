import { Entity } from '../../../../types';
import { defineDeclarations } from './defineDeclarations';
import { defineFindOrCreateStaticEntityLogic } from './defineFindOrCreateStaticEntityLogic';
import { defineInsertVersionIfDynamicDataChangedLogic } from './defineInsertVersionIfDynamicDataChangedLogic';
import { defineUpsertCurrentVersionPointerIfNeededLogic } from './defineUpsertCurrentVersionPointerIfNeededLogic';
import { castPropertyToFunctionInputDefinition } from './utils/castPropertyToFunctionInputDefinition';

/*
1. define procedure / function (try function if possible)
2. define inputs
3. declare needed inputs
4. logic
  1. find or create the static entity, get the id of the static entity
    - if inserting, insert into mapping tables too
  2. check if the version has changed
  3. if the version has changed, insert a new version
  5. return the id of the static entity
*/

/*
  what is affected by array properties:
    - input type (json array) -vs- saved type (char(36) <- hash) && mapping table inputs
    - input name -vs- table name

  ---

  and

  ----

  so:
  - conversions:
    - 1. input name -> stored name for array properties
    - 2. normal name -> stored name for array properties
    - 3. normal name -> mapping table for array properties

  ----

  ideally:

  upsert_x(in_tag_ids VARCHAR(5000)) {
    -- calculate hashes for arrays
    v_tag_ids_hash = SHA256(in_tag_ids);
    v_name_ids_hash = SHA256(in_name_ids);

    -- find unique
    SELECT * WHERE
      ...
      AND tag_ids_hash = SHA256(v_tag_ids_hash)

    -- insert if dne
    if (null) {
      -- insert main
      INSERT INTO (tag_ids_hash)
      VALUES
        (v_tag_ids_hash)

      -- insert into mapping table, if array props exist
      FOR tag IN in_tags {
        INSERT INTO x_to_tag (x_id, tag_id) VALUES (v_entity_id, tag.id);
      }
    }

    -- do the same for the version

  }

  SO changes:
    - calculate the hash value one time for each array prop
    - change the property name if array and change the property type if array (name => ${name}_hash, type => CHAR(32))
      - when checking or inserting
    - insert into mapping tables any time inserting static row or version row
*/

/*

  // define the property names
  const updatablePropertyNames = Object.entries(entity.properties)
    .filter((entry) => !!entry[1].updatable)
    .map((entry) => entry[0]);

  // define where clause conditionals
  const updateablePropertyWhereClauseConditionals = updatablePropertyNames.map((name) =>
    propertyNameToWhereClauseConditional({ name, entity }),
  );

*/

export const generateEntityUpsert = ({ entity }: { entity: Entity }) => {
  // define the input definitions
  const inputDefinitions = Object.entries(entity.properties).map((entry) =>
    castPropertyToFunctionInputDefinition({ name: entry[0], definition: entry[1] }),
  );

  // define the declarations
  const declarations = defineDeclarations({ entity });

  // define all of the different logic required for a complete upsert
  const findOrCreateStaticEntityLogic = defineFindOrCreateStaticEntityLogic({ entity });
  const insertVersionIfDynamicDataChangedLogic = defineInsertVersionIfDynamicDataChangedLogic({ entity });
  const upsertCurrentVersionPointerIfNeededLogic = defineUpsertCurrentVersionPointerIfNeededLogic({ entity });

  // combine the version and static logic into full upsert function
  const definition = `
CREATE FUNCTION \`upsert_${entity.name}\`(
  ${inputDefinitions.join(',\n  ')}
) RETURNS bigint(20)
BEGIN
  -- declarations
  ${declarations.join('\n  ')}

  ${[findOrCreateStaticEntityLogic, insertVersionIfDynamicDataChangedLogic, upsertCurrentVersionPointerIfNeededLogic]
    .filter((sql) => !!sql)
    .join('\n\n  ')}

  -- return the static entity id
  return v_static_id;
END
  `.trim();
  return {
    name: `upsert_${entity.name}`,
    sql: definition,
  };
};
