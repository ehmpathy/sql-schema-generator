import { DataTypeName, Property } from '../../../domain';

export enum EntityReferenceType {
  DIRECT_FK_REFERENCE = 'DIRECT_FK_REFERENCE', // i.e., this is a reference to a row in another table in _this_ database
  IMPLICIT_UUID_REFERENCE = 'IMPLICIT_UUID_REFERENCE', // i.e., this is reference to a row in a table in a _different_ database
}

/**
 * defines the important keys for an entity + property mapping table
 *
 * background:
 * - mapping tables are how arrays of data are persisted in relational databases
 * - arrays should only ever be of _relationships_ between entities (i.e., not an array of "favorite_fruit_names", but an array of references to "fruits")
 * - references can be made explicitly (within the database by fk) or implicitly (between distributed databases by uuid)
 *
 * refs:
 * - https://stackoverflow.com/a/17371788/3068233
 */
export const defineMappingTableKeysForEntityProperty = ({
  entityName,
  propertyName,
  propertyDefinition,
}: {
  entityName: string;
  propertyName: string;
  propertyDefinition: Property;
}): {
  tableName: string;
  entityReferenceColumnName: string;
  mappedEntityReferenceColumnType: 'bigint' | 'uuid';
  mappedEntityReferenceColumnName: string;
  entityReferenceTableName: string;
  arrayOrderIndexColumnName: string;
} => {
  // determine what kind of reference we're tracking (direct fk reference, or distributed uuid reference)
  const referenceType = (() => {
    if (propertyDefinition.references)
      return EntityReferenceType.DIRECT_FK_REFERENCE;
    if (propertyDefinition.type.name === DataTypeName.UUID)
      return EntityReferenceType.IMPLICIT_UUID_REFERENCE; // arrays should only be used to reference other tables, so we assume that this case implies its an uuid reference
    throw new Error(
      'Array properties should only be used to reference other entities either directly by foreign-key or implicitly by uuid. Therefore, arrays must REFERENCE an entity or store a UUID, in order to create a mapping table.', // https://stackoverflow.com/a/17371788/3068233
    );
  })();

  // determine if mapping table should reference version table or static table
  const entityReferenceTableName = propertyDefinition.updatable
    ? `${entityName}_version`
    : entityName;

  // define what the array order index column is named
  const arrayOrderIndexColumnName = 'array_order_index'; // goal: be self evident to people who will be seeing this for the first time

  // handle case where we are mapping directly to an entity, within this database, by fk
  if (referenceType === EntityReferenceType.DIRECT_FK_REFERENCE) {
    const mappedEntityReferenceTableName = propertyDefinition.references;
    return {
      tableName: `${entityReferenceTableName}_to_${mappedEntityReferenceTableName}`,
      entityReferenceColumnName: `${entityReferenceTableName}_id`,
      mappedEntityReferenceColumnName: `${mappedEntityReferenceTableName}_id`,
      mappedEntityReferenceColumnType: 'bigint',
      entityReferenceTableName,
      arrayOrderIndexColumnName,
    };
  }

  // handle case where we are mapping implicitly to an entity, potentially in a different database, by uuid
  if (referenceType === EntityReferenceType.IMPLICIT_UUID_REFERENCE) {
    const propertyNameEndsWithUuidsSuffix = new RegExp(/_uuids$/).test(
      propertyName,
    );
    if (!propertyNameEndsWithUuidsSuffix)
      // sanity check
      throw new Error(
        `an array of uuids must end with the '_uuids' suffix. not satisfied by '${entityName}.${propertyName}'`, // fail fast if not met
      );
    const impliedMappedEntityReferenceTableName = propertyName.replace(
      /_uuids$/,
      '',
    ); // this is the name of the referenced table that the property name _implies_
    return {
      tableName: `${entityReferenceTableName}_to_${impliedMappedEntityReferenceTableName}_uuid`, // note the _uuid suffix -> to make it extra explicit that we're tracking uuids of these ones + they may not be real name of an entity
      entityReferenceColumnName: `${entityReferenceTableName}_id`,
      mappedEntityReferenceColumnName: `${impliedMappedEntityReferenceTableName}_uuid`,
      mappedEntityReferenceColumnType: 'uuid',
      entityReferenceTableName,
      arrayOrderIndexColumnName,
    };
  }

  // if neither of the above cases caught it, then something went wrong - fail fast
  throw new Error(
    'unexpected table reference type. this should not occur and implies a bug within sql-schema-generator',
  ); // fail fast
};
