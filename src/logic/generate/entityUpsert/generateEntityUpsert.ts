import { Entity, Property } from '../../../types';
import { extractMysqlTypeDefinitionFromProperty } from '../utils/extractMysqlTypeDefinitionFromProperty';
/*
1. define procedure / function (try function if possible)
2. define inputs
3. declare needed inputs
4. logic
  1. domain logic validation? - no, user should wrap our sproc in their own if they want custom logic - or modify the generated one
  2. find or create the static entity, get the id of the static entity
  3. check if the version has changed
  4. if the version has changed, insert a new version
  5. return the id of the static entity
*/

const propertyNameToWhereClauseConditional = ({ name, entity }: { name: string, entity: Entity }) => [
  `AND (${name} = BINARY in_${name}`, // compare against binary rep of string to ensure case sensitivity (even though column may be case sensitive, mysql will still "help us out")
  (entity.properties[name].nullable) ? ` OR (${name} IS null AND in_${name} IS null)` : '', // NULL != NULL, so special check if field is nullable
  ')',
].join('');
const propertyNameToInputName = (name: string) => `in_${name}`;
const propertyToFunctionInputDefinition = ({ name, definition }: { name: string, definition: Property }) => [
  propertyNameToInputName(name),
  extractMysqlTypeDefinitionFromProperty({ property: definition }),
].join(' ');

export const generateEntityUpsert = ({ entity }: { entity: Entity }) => {
  // define the property names
  const staticPropertyNames = Object.entries(entity.properties).filter(entry => !entry[1].updatable).map(entry => entry[0]);
  const updateablePropertyNames = Object.entries(entity.properties).filter(entry => !!entry[1].updatable).map(entry => entry[0]);

  // define where clause conditionals
  const uniqueStaticPropertyNames = staticPropertyNames.filter(name => entity.unique.includes(name));
  const uniqueStaticPropertyWhereClauseConditionals = uniqueStaticPropertyNames.map(name => propertyNameToWhereClauseConditional({ name, entity }));
  const updateablePropertyWhereClauseConditionals = updateablePropertyNames.map(name => propertyNameToWhereClauseConditional({ name, entity }));

  // define the input definitions
  const inputDefinitions = Object.entries(entity.properties).map(entry => propertyToFunctionInputDefinition({ name: entry[0], definition: entry[1] }));

  // define the findOrCreateStaticEntityLogic
  const findOrCreateStaticEntityLogic = `
  -- find or create the static entity
  SET v_static_id = (
    SELECT id
    FROM ${entity.name}
    WHERE 1=1
      ${uniqueStaticPropertyWhereClauseConditionals.join('\n      ')}
  );
  IF (v_static_id IS NULL) THEN -- if entity could not be found originally, create the static entity
    INSERT INTO ${entity.name}
      (uuid, ${staticPropertyNames.join(', ')})
      VALUES
      (uuid(), ${staticPropertyNames.map(propertyNameToInputName).join(', ')});
    SET v_static_id = (
      SELECT id
      FROM ${entity.name}
      WHERE 1=1
        ${uniqueStaticPropertyWhereClauseConditionals.join('\n        ')}
    );
  END IF;
  `.trim();

  // define the update version logic
  const insertVersionIfDynamicDataChangedLogic = (updateablePropertyNames.length)
    ? `
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
      ${updateablePropertyWhereClauseConditionals.join('\n      ')}
  );
  IF (v_matching_version_id IS NULL) THEN -- if the latest version does not match, insert a new version
    INSERT INTO ${entity.name}_version
      (${entity.name}_id, ${updateablePropertyNames.join(', ')})
      VALUES
      (v_static_id, ${updateablePropertyNames.map(propertyNameToInputName).join(', ')});
  END IF;
    `.trim()
    : ''; // if no updateable properties, no logic needed

  // combine the version and static logic into full upsert function
  const definition = `
CREATE DEFINER=\`root\`@\`%\` FUNCTION \`upsert_${entity.name}\`(
  ${inputDefinitions.join(',\n  ')}
)
RETURNS BIGINT
BEGIN
  -- declarations
  DECLARE v_static_id BIGINT;
  DECLARE v_matching_version_id BIGINT;

  ${[findOrCreateStaticEntityLogic, insertVersionIfDynamicDataChangedLogic].filter(sql => !!sql).join('\n\n\n  ')}

  -- return the static entity id
  return v_static_id;
END
  `.trim();
  return {
    name: `upsert_${entity.name}`,
    sql: definition,
  };
};
