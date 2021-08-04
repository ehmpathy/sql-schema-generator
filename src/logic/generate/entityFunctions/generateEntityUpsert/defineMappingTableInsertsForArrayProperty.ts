import { Property } from '../../../../domain';
import { defineMappingTableKeysForEntityProperty } from '../../utils/defineMappingTableKeysForEntityProperty';
import { castPropertyToInputVariableName } from './utils/castPropertyToInputVariableName';

/*
  define the loop that will, for an array property:
  - loop through the csv value of the input variable of the function for this prop
  - insert a row per value into the mapping table relating this entity to the entity referenced in the property

  reference:
    https://www.postgresql.org/docs/10/plpgsql-control-structures.html#PLPGSQL-FOREACH-ARRAY
*/
export const defineMappingTableInsertsForArrayProperty = ({
  name,
  definition,
  entityName,
}: {
  name: string;
  definition: Property;
  entityName: string;
}) => {
  const inputVariableName = castPropertyToInputVariableName({ name });
  const mappingTableKeys = defineMappingTableKeysForEntityProperty({ entityName, propertyDefinition: definition });
  const mappingTableEntityReferenceVariable = definition.updatable ? 'v_matching_version_id' : 'v_static_id';

  return `
  -- insert a row into the mapping table for each value in array ${inputVariableName}
  FOR v_array_access_index IN 1 .. coalesce(array_upper(${inputVariableName}, 1), 0)
  LOOP
    INSERT INTO ${mappingTableKeys.tableName}
      (created_at, ${mappingTableKeys.entityReferenceColumnName}, ${mappingTableKeys.mappedEntityReferenceColumnName}, ${mappingTableKeys.arrayOrderIndexColumnName})
      VALUES
      (v_created_at, ${mappingTableEntityReferenceVariable}, ${inputVariableName}[v_array_access_index], v_array_access_index);
  END LOOP;
  `.trim();
};
