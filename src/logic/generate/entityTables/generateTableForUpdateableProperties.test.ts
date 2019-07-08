import { Property } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateTable } from './generateTable';
import { generateTableForUpdateableProperties } from './generateTableForUpdateableProperties';

jest.mock('./generateTable');
const generateTableMock = generateTable as jest.Mock;

describe('generateTableForUpdateableProperties', () => {
  it('should generate table with the generateTable method, with accurate table name and unique properties', async () => {
    await generateTableForUpdateableProperties({
      entityName: '__ENTITY_NAME__',
      properties: { testProp: 'TEST_PROP' as any },
    });
    expect(generateTableMock.mock.calls.length).toEqual(1);
    expect(generateTableMock.mock.calls[0][0]).toMatchObject({
      tableName: '__ENTITY_NAME___version',
      unique: ['__ENTITY_NAME___id', 'effective_at', 'created_at'],
      properties: {
        testProp: 'TEST_PROP',
      },
    });
  });
  it('should add an id, uuid, and created_at columns', async () => {
    await generateTableForUpdateableProperties({
      entityName: '__ENTITY_NAME__',
      properties: { testProp: 'TEST_PROP' as any },
    });
    expect(generateTableMock.mock.calls[0][0]).toMatchObject({
      properties: {
        id: prop.BIGINT(20),
        __ENTITY_NAME___id: new Property({
          ...prop.BIGINT(20),
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
      },
    });
  });
});
