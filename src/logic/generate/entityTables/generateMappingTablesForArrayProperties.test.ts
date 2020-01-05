import { prop, Property } from '../../../contract/module';
import { generateMappingTablesForArrayProperties } from './generateMappingTablesForArrayProperties';
import { generateTable } from './generateTable';

jest.mock('./generateTable');
const generateTableMock = generateTable as jest.Mock;

describe('generateMappingTablesForArrayProperties', () => {
  beforeEach(() => jest.clearAllMocks());
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
      unique: ['wrench_id', 'diameter_id'],
      properties: expect.objectContaining({
        ['wrench_id']: new Property({
          ...prop.BIGINT(),
          references: 'wrench',
        }),
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
      unique: ['wrench_version_id', 'tag_id'],
      properties: expect.objectContaining({
        ['wrench_version_id']: new Property({
          ...prop.BIGINT(),
          references: 'wrench_version', // since "tags" are a property of the entities version, not the static entity
        }),
        ['tag_id']: new Property({
          ...prop.BIGINT(),
          references: 'tag',
        }),
      }),
    });
  });
});
