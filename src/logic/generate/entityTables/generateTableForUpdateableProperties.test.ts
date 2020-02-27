import { Property } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateTable } from './generateTable';
import { generateTableForUpdateableProperties } from './generateTableForUpdateableProperties';

jest.mock('./generateTable');
const generateTableMock = generateTable as jest.Mock;

describe('generateTableForUpdateableProperties', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should generate table with the generateTable method, with accurate table name and unique properties', async () => {
    await generateTableForUpdateableProperties({
      entityName: '__ENTITY_NAME__',
      properties: { testProp: 'TEST_PROP' as any },
    });
    expect(generateTableMock).toHaveBeenCalledTimes(1);
    expect(generateTableMock).toHaveBeenCalledWith({
      tableName: '__ENTITY_NAME___version',
      unique: ['__ENTITY_NAME___id', 'effective_at', 'created_at'],
      properties: expect.objectContaining({
        testProp: 'TEST_PROP',
      }),
    });
  });
  it('should add an id, uuid, and created_at columns', async () => {
    await generateTableForUpdateableProperties({
      entityName: '__ENTITY_NAME__',
      properties: { testProp: 'TEST_PROP' as any },
    });
    expect(generateTableMock).toHaveBeenCalledTimes(1);
    expect(generateTableMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          id: prop.BIGINT(),
          __ENTITY_NAME___id: new Property({
            ...prop.BIGINT(),
            references: '__ENTITY_NAME__',
          }),
          effective_at: new Property({
            ...prop.DATETIME(6),
            default: 'CURRENT_TIMESTAMP(6)',
          }),
          created_at: new Property({
            ...prop.DATETIME(6),
            default: 'CURRENT_TIMESTAMP(6)',
          }),
        }),
      }),
    );
  });
  it('should convert array properties into "values hash" properties', async () => {
    /*
      purpose:
        having the values_hash will allow us to quickly and easily query to see if the full array is exactly equal to another row's full array

      example:
        if we need to determine whether or not the current version's array is equal to the array in the upsert
    */
    await generateTableForUpdateableProperties({
      entityName: '__ENTITY_NAME__',
      properties: { testProp: { type: 'TEST_PROP', updatable: true, array: true } as any },
    });
    expect(generateTableMock).toHaveBeenCalledTimes(1);
    expect(generateTableMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          testProp_hash: prop.BINARY(32), // 32 since SHA256 binary string is 32 bytes long
        }),
      }),
    );
  });
});
