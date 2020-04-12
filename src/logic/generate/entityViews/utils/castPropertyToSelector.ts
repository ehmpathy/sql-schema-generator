import { Property } from '../../../../types';
import { defineMappingTableKeysForEntityProperty } from '../../utils/defineMappingTableKeysForEntityProperty';

export const castPropertyToSelector = ({
  entityName,
  name,
  definition,
}: {
  entityName: string;
  name: string;
  definition: Property;
}) => {
  // if property is an array, the selector should CONCAT_WS from the mapping table
  if (definition.array) {
    const mappingTableKeys = defineMappingTableKeysForEntityProperty({ entityName, propertyDefinition: definition });
    const entityReferenceTableNameAlias = definition.updatable ? 'v' : 's';
    const arrayValueSelector = `${mappingTableKeys.tableName}.${mappingTableKeys.mappedEntityReferenceColumnName}`;
    const arrayIndexSelector = `${mappingTableKeys.tableName}.${mappingTableKeys.arrayOrderIndexColumnName}`;
    const entityReferenceSelector = `${mappingTableKeys.tableName}.${mappingTableKeys.entityReferenceColumnName}`;
    const entityReferenceId = `${entityReferenceTableNameAlias}.id`;
    const mappingTableName = mappingTableKeys.tableName;
    return `
(
  SELECT GROUP_CONCAT(${arrayValueSelector} ORDER BY ${arrayIndexSelector} ASC SEPARATOR ',')
  FROM ${mappingTableName} WHERE ${entityReferenceSelector} = ${entityReferenceId}
) as ${name}
    `.trim();
  }

  // otherwise, if its an updatable property, its on the version table
  if (definition.updatable) return `v.${name}`;

  // and if its not updatable and not array, then its on the static table
  return `s.${name}`;
};
