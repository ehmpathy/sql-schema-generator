import { Property } from '../../../domain';

/*
  defines the important keys for an entity + property mapping table
*/
export const defineMappingTableKeysForEntityProperty = ({
  entityName,
  propertyDefinition,
}: {
  entityName: string;
  propertyDefinition: Property;
}) => {
  // 1. determine if mapping table should reference version table or static table
  const entityReferenceTableName = propertyDefinition.updatable ? `${entityName}_version` : entityName;

  // 2. determine the mapped entity table reference name
  if (!propertyDefinition.references) {
    throw new Error('array property must REFERENCE an entity, in order to create mapping table');
  }
  const mappedEntityReferenceTableName = propertyDefinition.references;

  // define the keys
  const tableName = `${entityReferenceTableName}_to_${mappedEntityReferenceTableName}`;
  const entityReferenceColumnName = `${entityReferenceTableName}_id`;
  const mappedEntityReferenceColumnName = `${mappedEntityReferenceTableName}_id`;
  const arrayOrderIndexColumnName = 'array_order_index'; // purpose: be self evident to people who will be seeing this for the first time
  return {
    tableName,
    entityReferenceColumnName,
    mappedEntityReferenceColumnName,
    entityReferenceTableName,
    mappedEntityReferenceTableName,
    arrayOrderIndexColumnName,
  };
};
