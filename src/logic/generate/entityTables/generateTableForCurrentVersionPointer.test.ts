import { Property } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateTable } from './generateTable';
import { generateTableForCurrentVersionPointer } from './generateTableForCurrentVersionPointer';

jest.mock('./generateTable');
const generateTableMock = generateTable as jest.Mock;

describe('generateTableForCurrentVersionPointer', () => {
  it('should generate table with the generateTable method, with accurate table name and unique properties', async () => {
    await generateTableForCurrentVersionPointer({
      entityName: '__ENTITY_NAME__',
    });
    expect(generateTableMock.mock.calls.length).toEqual(1);
    expect(generateTableMock.mock.calls[0][0]).toMatchObject({
      tableName: '__ENTITY_NAME___cvp',
      unique: ['__ENTITY_NAME___id'],
    });
  });
  it('should add an id, updated_at, and fk columns', async () => {
    await generateTableForCurrentVersionPointer({
      entityName: '__ENTITY_NAME__',
    });
    expect(generateTableMock.mock.calls[0][0]).toMatchObject({
      properties: {
        id: prop.BIGSERIAL(),
        __ENTITY_NAME___id: new Property({
          ...prop.BIGINT(),
          references: '__ENTITY_NAME__',
        }),
        __ENTITY_NAME___version_id: new Property({
          ...prop.BIGINT(),
          references: '__ENTITY_NAME___version',
        }),
        updated_at: new Property({
          ...prop.TIMESTAMPTZ(),
          default: 'now()',
        }),
      },
    });
  });
});
