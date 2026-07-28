import { Property } from '@src/domain.objects';
import * as prop from '@src/domain.operations/define/defineProperty';

import { generateTable } from './generateTable';
import { generateTableForStaticProperties } from './generateTableForStaticProperties';

jest.mock('./generateTable');
const generateTableMock = generateTable as jest.Mock;

describe('generateTableForStaticProperties', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should generate table with the properties defined', async () => {
    await generateTableForStaticProperties({
      entityName: '__ENTITY_NAME__',
      unique: ['uniqueProp'],
      properties: {
        testProp: '__TEST_PROP__' as any,
        uniqueProp: '__TEST_PROP__' as any,
      },
    });
    expect(generateTableMock).toHaveBeenCalledTimes(1);
    expect(generateTableMock).toHaveBeenCalledWith({
      tableName: '__ENTITY_NAME__',
      unique: ['uniqueProp'],
      properties: expect.objectContaining({
        testProp: '__TEST_PROP__',
        uniqueProp: '__TEST_PROP__',
      }),
    });
  });
  it('should add an id, uuid, and created_at columns', async () => {
    await generateTableForStaticProperties({
      entityName: '__ENTITY_NAME__',
      unique: ['uniqueProp'],
      properties: {
        testProp: '__TEST_PROP__' as any,
        uniqueProp: '__TEST_PROP__' as any,
      },
    });
    expect(generateTableMock).toHaveBeenCalledTimes(1);
    expect(generateTableMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({
          id: prop.BIGSERIAL(),
          uuid: prop.UUID(),
          created_at: new Property({
            ...prop.TIMESTAMPTZ(),
            default: 'now()',
          }),
        }),
      }),
    );
  });
  it('should convert join-table array properties into "hash" properties', async () => {
    /*
      purpose:
        a data hash lets us quickly and easily query to see if the full array is exactly equal to another row's full array

      example:
        if we need to be unique on the property and it happens to be a join-table (reference/uuid) array
    */
    await generateTableForStaticProperties({
      entityName: '__ENTITY_NAME__',
      unique: ['uniqueProp'],
      properties: {
        testProp: prop.ARRAY_OF(prop.UUID()), // a uuid array is a join-table array -> hashed
        uniqueProp: '__TEST_PROP__' as any,
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
    const nativeArrayProp = prop.ARRAY_OF(prop.VARCHAR());
    await generateTableForStaticProperties({
      entityName: '__ENTITY_NAME__',
      unique: ['uniqueProp'],
      properties: {
        testProp: nativeArrayProp,
        uniqueProp: '__TEST_PROP__' as any,
      },
    });
    expect(generateTableMock).toHaveBeenCalledTimes(1);
    const passedProperties = generateTableMock.mock.calls[0]![0].properties;
    expect(passedProperties.testProp).toEqual(nativeArrayProp); // passed through as-is
    expect(passedProperties.testProp_hash).toEqual(undefined); // no hash column
  });
  it('should be able to be unique on a join-table array property', async () => {
    await generateTableForStaticProperties({
      entityName: '__ENTITY_NAME__',
      unique: ['testProp'],
      properties: { testProp: prop.ARRAY_OF(prop.UUID()) },
    });
    expect(generateTableMock).toHaveBeenCalledTimes(1);
    expect(generateTableMock).toHaveBeenCalledWith(
      expect.objectContaining({
        unique: ['testProp_hash'], // note: it _must_ pass the "hash" suffix, in order for the "create table" logic to find the correct column
        properties: expect.objectContaining({
          testProp_hash: prop.BYTEA(),
        }),
      }),
    );
  });
});
