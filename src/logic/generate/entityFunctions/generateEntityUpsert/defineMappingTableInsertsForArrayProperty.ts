import { Property } from '../../../../types';
import { defineMappingTableKeysForEntityProperty } from '../../utils/defineMappingTableKeysForEntityProperty';
import { castPropertyToInputVariableName } from './utils/castPropertyToInputVariableName';

/*
  define the loop that will, for an array property:
  - loop through the csv value of the input variable of the function for this prop
  - insert a row per value into the mapping table relating this entity to the entity referenced in the property

  reference:
    https://dev.mysql.com/doc/refman/8.0/en/string-functions.html
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
    -- insert a row into the mapping table for each value in the ${inputVariableName} comma delimited string
    SET v_can_still_find_values_in_delimited_string = true;
    SET v_delimited_string_access_index = 0;
    WHILE (v_can_still_find_values_in_delimited_string) DO
      SET v_delimited_string_access_value = get_from_delimiter_split_string(${inputVariableName}, ',', v_delimited_string_access_index); -- get value from string
      IF (v_delimited_string_access_value = '') THEN
        SET v_can_still_find_values_in_delimited_string = false; -- no value at this index, stop looping
      ELSE
        INSERT INTO ${mappingTableKeys.tableName}
          (created_at, ${mappingTableKeys.entityReferenceColumnName}, ${mappingTableKeys.mappedEntityReferenceColumnName}, ${mappingTableKeys.arrayOrderIndexColumnName})
          VALUES
          (v_created_at, ${mappingTableEntityReferenceVariable},v_delimited_string_access_value, v_delimited_string_access_index);
      END IF;
      SET v_delimited_string_access_index = v_delimited_string_access_index + 1;
    END WHILE;
  `.trim();
};
