import { Property } from '../../../domain';
import { prop } from '../../define';
import { generateMappingTablesForArrayProperties } from './generateMappingTablesForArrayProperties';
import { generateTable } from './generateTable';

jest.mock('./generateTable');
const generateTableMock = generateTable as jest.Mock;

describe('generateMappingTablesForArrayProperties', () => {
  beforeEach(() => jest.clearAllMocks());
  describe('direct fk reference', () => {
    it('should generate a mapping table per static property accurately', async () => {
      const properties = {
        diameter_ids: { ...prop.BIGINT(), array: true, references: 'diameter' },
      };
      const entityMappingTables = generateMappingTablesForArrayProperties({ entityName: 'wrench', properties });
      expect(entityMappingTables.length).toEqual(1);
      expect(entityMappingTables[0].name).toEqual('wrench_to_diameter');
      expect(generateTableMock).toHaveBeenCalledTimes(1);
      expect(generateTableMock).toHaveBeenCalledWith({
        tableName: 'wrench_to_diameter',
        unique: ['wrench_id', 'array_order_index'],
        properties: expect.objectContaining({
          ['wrench_id']: new Property({
            ...prop.BIGINT(),
            references: 'wrench',
          }),
          ['array_order_index']: prop.SMALLINT(),
          ['diameter_id']: new Property({
            ...prop.BIGINT(),
            references: 'diameter',
          }),
        }),
      });
    });
    it('should generate a mapping table per updatable property accurately', async () => {
      const properties = {
        tag_ids: { ...prop.BIGINT(), array: true, updatable: true, references: 'tag' },
      };
      const entityMappingTables = generateMappingTablesForArrayProperties({ entityName: 'wrench', properties });
      expect(entityMappingTables.length).toEqual(1);
      expect(entityMappingTables[0].name).toEqual('wrench_version_to_tag'); // since updatable, only the version of a wrench points to a tag
      expect(generateTableMock).toHaveBeenCalledTimes(1);
      expect(generateTableMock).toHaveBeenCalledWith({
        tableName: 'wrench_version_to_tag',
        unique: ['wrench_version_id', 'array_order_index'],
        properties: expect.objectContaining({
          ['wrench_version_id']: new Property({
            ...prop.BIGINT(),
            references: 'wrench_version', // since "tags" are a property of the entities version, not the static entity
          }),
          ['array_order_index']: prop.SMALLINT(),
          ['tag_id']: new Property({
            ...prop.BIGINT(),
            references: 'tag',
          }),
        }),
      });
    });
  });
  describe('implicit uuid reference', () => {
    it('should generate a mapping table per static property accurately', async () => {
      const properties = {
        diameter_uuids: { ...prop.UUID(), array: true },
      };
      const entityMappingTables = generateMappingTablesForArrayProperties({ entityName: 'wrench', properties });
      expect(entityMappingTables.length).toEqual(1);
      expect(entityMappingTables[0].name).toEqual('wrench_to_diameter_uuid');
      expect(generateTableMock).toHaveBeenCalledTimes(1);
      expect(generateTableMock).toHaveBeenCalledWith({
        tableName: 'wrench_to_diameter_uuid',
        unique: ['wrench_id', 'array_order_index'],
        properties: expect.objectContaining({
          ['wrench_id']: new Property({
            ...prop.BIGINT(),
            references: 'wrench',
          }),
          ['array_order_index']: prop.SMALLINT(),
          ['diameter_uuid']: prop.UUID(),
        }),
      });
    });
    it('should generate a mapping table per updatable property accurately', async () => {
      const properties = {
        tag_uuids: { ...prop.UUID(), array: true, updatable: true },
      };
      const entityMappingTables = generateMappingTablesForArrayProperties({ entityName: 'wrench', properties });
      expect(entityMappingTables.length).toEqual(1);
      expect(entityMappingTables[0].name).toEqual('wrench_version_to_tag_uuid'); // since updatable, only the version of a wrench points to a tag
      expect(generateTableMock).toHaveBeenCalledTimes(1);
      expect(generateTableMock).toHaveBeenCalledWith({
        tableName: 'wrench_version_to_tag_uuid',
        unique: ['wrench_version_id', 'array_order_index'],
        properties: expect.objectContaining({
          ['wrench_version_id']: new Property({
            ...prop.BIGINT(),
            references: 'wrench_version', // since "tags" are a property of the entities version, not the static entity
          }),
          ['array_order_index']: prop.SMALLINT(),
          ['tag_uuid']: prop.UUID(),
        }),
      });
    });
  });
});
