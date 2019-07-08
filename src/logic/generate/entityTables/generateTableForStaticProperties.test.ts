import { Property } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateTable } from './generateTable';
import { generateTableForStaticProperties } from './generateTableForStaticProperties';

jest.mock('./generateTable');
const generateTableMock = generateTable as jest.Mock;

describe('generateTableForStaticProperties', () => {
  it('should generate table with the generateTable method', async () => {
    await generateTableForStaticProperties({
      entityName: '__ENTITY_NAME__',
      unique: ['__UNIQUE_ONE__'],
      properties: { testProp: 'TEST_PROP' as any },
    });
    expect(generateTableMock.mock.calls.length).toEqual(1);
    expect(generateTableMock.mock.calls[0][0]).toMatchObject({
      tableName: '__ENTITY_NAME__',
      unique: ['__UNIQUE_ONE__'],
      properties: {
        testProp: 'TEST_PROP',
      },
    });
  });
  it('should add an id, uuid, and created_at columns', async () => {
    await generateTableForStaticProperties({
      entityName: '__ENTITY_NAME__',
      unique: ['__UNIQUE_ONE__'],
      properties: { testProp: 'TEST_PROP' as any },
    });
    expect(generateTableMock.mock.calls[0][0]).toMatchObject({
      properties: {
        id: prop.BIGINT(20),
        uuid: prop.UUID(),
        created_at: new Property({
          ...prop.DATETIME(6),
          default: 'CURRENT_TIMESTAMP(6)',
        }),
      },
    });
  });
});
