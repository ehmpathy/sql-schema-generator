import type { Property } from '@src/domain.objects';
import { defineMappingTableKeysForEntityProperty } from '@src/domain.operations/generate/utils/defineMappingTableKeysForEntityProperty';
import { extractDataTypeDefinitionFromProperty } from '@src/domain.operations/generate/utils/extractDataTypeDefinitionFromProperty';
import { isNativeArrayProperty } from '@src/domain.operations/utils/isNativeArrayProperty';

export const castPropertyToSelector = ({
  entityName,
  name,
  definition,
}: {
  entityName: string;
  name: string;
  definition: Property;
}) => {
  // a native array is a real column - but coalesce a null to an empty array, so the DAO
  //   sees one shape ([], never null) across both native and join-table storage
  //   (this matches the join-table convention, whose array_agg also coalesces to array[])
  if (isNativeArrayProperty({ property: definition })) {
    const arrayTableAlias = definition.updatable ? 'v' : 's';
    const arrayDataType = extractDataTypeDefinitionFromProperty({
      property: definition,
    });
    return `coalesce(${arrayTableAlias}.${name}, array[]::${arrayDataType}) as ${name}`;
  }

  // a join-table array needs the array_agg collapse handled here
  //   (native arrays already returned above, so any array reaching here is join-table)
  if (definition.array) {
    const mappingTableKeys = defineMappingTableKeysForEntityProperty({
      entityName,
      propertyName: name,
      propertyDefinition: definition,
    });
    const entityReferenceTableNameAlias = definition.updatable ? 'v' : 's';
    const arrayValueSelector = `${mappingTableKeys.tableName}.${mappingTableKeys.mappedEntityReferenceColumnName}`;
    const arrayIndexSelector = `${mappingTableKeys.tableName}.${mappingTableKeys.arrayOrderIndexColumnName}`;
    const arrayDataType = `${mappingTableKeys.mappedEntityReferenceColumnType}[]`;
    const entityReferenceSelector = `${mappingTableKeys.tableName}.${mappingTableKeys.entityReferenceColumnName}`;
    const entityReferenceId = `${entityReferenceTableNameAlias}.id`;
    const mappingTableName = mappingTableKeys.tableName;
    return `
(
  SELECT coalesce(array_agg(${arrayValueSelector} ORDER BY ${arrayIndexSelector}), array[]::${arrayDataType}) as array_agg
  FROM ${mappingTableName} WHERE ${entityReferenceSelector} = ${entityReferenceId}
) as ${name}
    `.trim();
  }

  // otherwise, if its an updatable property, its on the version table
  if (definition.updatable) return `v.${name}`;

  // and if its not updatable and not array, then its on the static table
  return `s.${name}`;
};
