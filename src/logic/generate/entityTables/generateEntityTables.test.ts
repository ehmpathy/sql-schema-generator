import { Entity } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateEntityTables } from './generateEntityTables';
import { generateTableForStaticProperties } from './generateTableForStaticProperties';
import { generateTableForUpdateableProperties } from './generateTableForUpdateableProperties';

jest.mock('./generateTableForStaticProperties');
const generateTableForStaticPropertiesMock = generateTableForStaticProperties as jest.Mock;
generateTableForStaticPropertiesMock.mockReturnValue({ name: '__ENTITY_NAME__', sql: '__STATIC_ENTITY_SQL__' });

jest.mock('./generateTableForUpdateableProperties');
const generateTableForUpdateablePropertiesMock = generateTableForUpdateableProperties as jest.Mock;
generateTableForUpdateablePropertiesMock.mockReturnValue({ name: '__ENTITY_NAME___version', sql: '__VERSIONED_ENTITY_SQL__' });

describe('generateEntityTables', () => {
  beforeEach(() => jest.clearAllMocks());
  const user = new Entity({
    name: 'user',
    properties: {
      cognito_uuid: prop.UUID(),
      name: {
        ...prop.VARCHAR(255),
        updatable: true,
      },
      bio: {
        ...prop.TEXT(),
        updatable: true,
        nullable: true,
      },
    },
    unique: ['cognito_uuid'],
  });
  it('should generateTableForStaticProperties for the static properties only', () => {
    generateEntityTables({ entity: user });
    expect(generateTableForStaticPropertiesMock.mock.calls.length).toEqual(1);
    expect(generateTableForStaticPropertiesMock.mock.calls[0][0]).toMatchObject({
      properties: {
        cognito_uuid: user.properties.cognito_uuid,
      },
    });
  });
  it('should generateTableForStaticProperties for the updateable properties only', () => {
    generateEntityTables({ entity: user });
    expect(generateTableForUpdateablePropertiesMock.mock.calls.length).toEqual(1);
    expect(generateTableForUpdateablePropertiesMock.mock.calls[0][0]).toMatchObject({
      properties: {
        name: user.properties.name,
        bio: user.properties.bio,
      },
    });
  });
});
