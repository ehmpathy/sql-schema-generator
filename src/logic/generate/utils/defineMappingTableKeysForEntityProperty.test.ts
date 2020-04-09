import { prop } from '../../define';
import { defineMappingTableKeysForEntityProperty } from './defineMappingTableKeysForEntityProperty';

describe('defineMappingTableNameForEntityProperty', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should define table name per static property accurately', async () => {
    const properties = {
      diameter_ids: { ...prop.BIGINT(), array: true, references: 'diameter' },
    };
    const keys = defineMappingTableKeysForEntityProperty({
      entityName: 'wrench',
      propertyDefinition: properties.diameter_ids,
    });
    expect(keys).toEqual({
      tableName: 'wrench_to_diameter',
      entityReferenceColumnName: 'wrench_id',
      mappedEntityReferenceColumnName: 'diameter_id',
      entityReferenceTableName: 'wrench',
      mappedEntityReferenceTableName: 'diameter',
      arrayOrderIndexColumnName: 'array_order_index',
    });
  });
  it('should generate a mapping table per updatable property accurately', async () => {
    const properties = {
      tag_ids: { ...prop.BIGINT(), array: true, updatable: true, references: 'tag' },
    };
    const keys = defineMappingTableKeysForEntityProperty({
      entityName: 'wrench',
      propertyDefinition: properties.tag_ids,
    });
    expect(keys).toEqual({
      tableName: 'wrench_version_to_tag',
      entityReferenceColumnName: 'wrench_version_id',
      mappedEntityReferenceColumnName: 'tag_id',
      entityReferenceTableName: 'wrench_version',
      mappedEntityReferenceTableName: 'tag',
      arrayOrderIndexColumnName: 'array_order_index',
    });
  });
});
