import { prop } from '../../define';
import { defineMappingTableKeysForEntityProperty } from './defineMappingTableKeysForEntityProperty';

describe('defineMappingTableNameForEntityProperty', () => {
  beforeEach(() => jest.clearAllMocks());
  describe('direct fk reference', () => {
    it('should define table name per static property accurately', async () => {
      const properties = {
        diameter_ids: { ...prop.BIGINT(), array: true, references: 'diameter' },
      };
      const keys = defineMappingTableKeysForEntityProperty({
        entityName: 'wrench',
        propertyName: 'diameter_ids',
        propertyDefinition: properties.diameter_ids,
      });
      expect(keys).toEqual({
        tableName: 'wrench_to_diameter',
        entityReferenceColumnName: 'wrench_id',
        mappedEntityReferenceColumnName: 'diameter_id',
        mappedEntityReferenceColumnType: 'bigint',
        entityReferenceTableName: 'wrench',
        arrayOrderIndexColumnName: 'array_order_index',
      });
    });
    it('should generate a mapping table per updatable property accurately', async () => {
      const properties = {
        tag_ids: { ...prop.BIGINT(), array: true, updatable: true, references: 'tag' },
      };
      const keys = defineMappingTableKeysForEntityProperty({
        entityName: 'wrench',
        propertyName: 'tag_ids',
        propertyDefinition: properties.tag_ids,
      });
      expect(keys).toEqual({
        tableName: 'wrench_version_to_tag',
        entityReferenceColumnName: 'wrench_version_id',
        mappedEntityReferenceColumnName: 'tag_id',
        mappedEntityReferenceColumnType: 'bigint',
        entityReferenceTableName: 'wrench_version',
        arrayOrderIndexColumnName: 'array_order_index',
      });
    });
  });
  describe('implicit uuid reference', () => {
    it('should define table name per static property accurately', async () => {
      const properties = {
        photo_uuids: { ...prop.UUID(), array: true },
      };
      const keys = defineMappingTableKeysForEntityProperty({
        entityName: 'house',
        propertyName: 'photo_uuids',
        propertyDefinition: properties.photo_uuids,
      });
      expect(keys).toEqual({
        tableName: 'house_to_photo_uuid',
        entityReferenceTableName: 'house',
        entityReferenceColumnName: 'house_id',
        mappedEntityReferenceColumnName: 'photo_uuid',
        mappedEntityReferenceColumnType: 'uuid',
        arrayOrderIndexColumnName: 'array_order_index',
      });
    });
    it('should generate a mapping table per updatable property accurately', async () => {
      const properties = {
        tag_uuids: { ...prop.UUID(), array: true, updatable: true },
      };
      const keys = defineMappingTableKeysForEntityProperty({
        entityName: 'wrench',
        propertyName: 'tag_uuids',
        propertyDefinition: properties.tag_uuids,
      });
      expect(keys).toEqual({
        tableName: 'wrench_version_to_tag_uuid',
        entityReferenceColumnName: 'wrench_version_id',
        mappedEntityReferenceColumnName: 'tag_uuid',
        mappedEntityReferenceColumnType: 'uuid',
        entityReferenceTableName: 'wrench_version',
        arrayOrderIndexColumnName: 'array_order_index',
      });
    });
  });
});
