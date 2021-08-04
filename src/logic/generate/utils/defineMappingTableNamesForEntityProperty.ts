import { Property } from '../../../domain';

export const defineMappingTableNamesForEntityProperty = ({
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

  // 3. return results
  return {
    entityReferenceTableName,
    mappedEntityReferenceTableName,
  };
};
