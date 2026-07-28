import { Property } from '@src/domain.objects';
import * as prop from '@src/domain.operations/define/defineProperty';

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
          id: prop.BIGSERIAL(),
          __ENTITY_NAME___id: new Property({
            ...prop.BIGINT(),
            references: '__ENTITY_NAME__',
          }),
          effective_at: new Property({
            ...prop.TIMESTAMPTZ(),
            default: 'now()',
          }),
          created_at: new Property({
            ...prop.TIMESTAMPTZ(),
            default: 'now()',
          }),
        }),
      }),
    );
  });
  it('should convert join-table array properties into "values hash" properties', async () => {
    /*
      purpose:
        a values_hash lets us quickly and easily query to see if the full array is exactly equal to another row's full array

      example:
        if we need to determine whether or not the current version's array is equal to the array in the upsert
    */
    await generateTableForUpdateableProperties({
      entityName: '__ENTITY_NAME__',
      properties: {
        testProp: { ...prop.ARRAY_OF(prop.UUID()), updatable: true }, // a uuid array is a join-table array -> hashed
      },
    });
    expect(generateTableMock).toHaveBeenCalledTimes(1);
    expect(generateTableMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          testProp_hash: prop.BYTEA(),
        }),
      }),
    );
  });
  it('should keep native array properties as real columns, not hash properties', async () => {
    /*
      purpose:
        a native primitive/enum array is stored inline as a real array column (e.g. text[]),
        so it must flow through under its own name, NOT be swapped for a values-hash column
    */
    const nativeArrayProp = {
      ...prop.ARRAY_OF(prop.VARCHAR()),
      updatable: true,
    };
    await generateTableForUpdateableProperties({
      entityName: '__ENTITY_NAME__',
      properties: {
        testProp: nativeArrayProp,
      },
    });
    expect(generateTableMock).toHaveBeenCalledTimes(1);
    const passedProperties = generateTableMock.mock.calls[0]![0].properties;
    expect(passedProperties.testProp).toEqual(nativeArrayProp); // passed through as-is
    expect(passedProperties.testProp_hash).toEqual(undefined); // no hash column
  });
});
