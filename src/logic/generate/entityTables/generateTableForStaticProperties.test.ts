import { Property } from '../../../types';
import * as prop from '../../define/defineProperty';
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
      properties: { testProp: '__TEST_PROP__' as any, uniqueProp: '__TEST_PROP__' as any },
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
      properties: { testProp: '__TEST_PROP__' as any, uniqueProp: '__TEST_PROP__' as any },
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
  it('should convert array properties into "hash" properties', async () => {
    /*
      purpose:
        having the data hash will allow us to quickly and easily query to see if the full array is exactly equal to another row's full array

      example:
        if we need to be unique on the property and it happens to be an array
    */
    await generateTableForStaticProperties({
      entityName: '__ENTITY_NAME__',
      unique: ['uniqueProp'],
      properties: { testProp: { type: 'TEST_PROP', array: true } as any, uniqueProp: '__TEST_PROP__' as any },
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
  it('should be able to be unique on an array property', async () => {
    await generateTableForStaticProperties({
      entityName: '__ENTITY_NAME__',
      unique: ['testProp'],
      properties: { testProp: { type: 'TEST_PROP', array: true } as any },
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
