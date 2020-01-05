import { prop } from '../../../contract/module';
import { Property } from '../../../types';
import { defineMappingTableKeysForEntityProperty } from '../utils/defineMappingTableKeysForEntityProperty';
import { generateTable } from './generateTable';

/*
  n:m relationships in relational databases are defined using mapping tables

  any time we specify an a property of an entity is an array, we are saying we have an n:m relationship

  thus, we must create the mapping tables for all entities which have "array" properties
    - and the mapping table must consider whether it is mapping to the static entity (i.e., prop is not updatable) or to the entity's version (i.e., prop is updatable)
*/
const generateMappingTableForArrayProperty = ({
  entityName,
  propertyDefinition,
}: {
  entityName: string;
  propertyDefinition: Property;
}) => {
  // 1. define keys for mapping table
  const mappingTableKeys = defineMappingTableKeysForEntityProperty({ entityName, propertyDefinition }); // defined in module because this data is used in the upsert and view

  // 3. define the full table properties for the mapping table
  const mappingTableProps = {
    id: prop.BIGINT(),
    created_at: new Property({
      ...prop.DATETIME(6),
      default: 'CURRENT_TIMESTAMP(6)',
    }),
    [mappingTableKeys.entityReferenceColumnName]: new Property({
      ...prop.BIGINT(),
      references: mappingTableKeys.entityReferenceTableName,
    }),
    [mappingTableKeys.mappedEntityReferenceColumnName]: new Property({
      ...prop.BIGINT(),
      references: mappingTableKeys.mappedEntityReferenceTableName,
    }),
  };

  // 4. build the table
  const tableName = mappingTableKeys.tableName;
  const unique = [mappingTableKeys.entityReferenceColumnName, mappingTableKeys.mappedEntityReferenceColumnName]; // unique on the two fk's
  const tableSql = generateTable({ tableName, unique, properties: mappingTableProps });

  // 5. return the table definition
  return {
    name: tableName,
    sql: tableSql,
  };
};

export const generateMappingTablesForArrayProperties = ({
  entityName,
  properties,
}: {
  entityName: string;
  properties: { [index: string]: Property };
}) => {
  // define a mapping table for each property
  const mappingTables = Object.entries(properties).map((entry) =>
    generateMappingTableForArrayProperty({ entityName, propertyDefinition: entry[1] }),
  );

  // return the mapping tables
  return mappingTables;
};
