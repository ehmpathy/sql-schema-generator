import { Entity, ValueObject } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateEntityTables } from './generateEntityTables';
import { generateMappingTablesForArrayProperties } from './generateMappingTablesForArrayProperties';
import { generateTableForCurrentVersionPointer } from './generateTableForCurrentVersionPointer';
import { generateTableForStaticProperties } from './generateTableForStaticProperties';
import { generateTableForUpdateableProperties } from './generateTableForUpdateableProperties';

jest.mock('./generateTableForStaticProperties');
const generateTableForStaticPropertiesMock = generateTableForStaticProperties as jest.Mock;
generateTableForStaticPropertiesMock.mockReturnValue({ name: '__ENTITY_NAME__', sql: '__STATIC_ENTITY_SQL__' });

jest.mock('./generateTableForUpdateableProperties');
const generateTableForUpdateablePropertiesMock = generateTableForUpdateableProperties as jest.Mock;
generateTableForUpdateablePropertiesMock.mockReturnValue({
  name: '__ENTITY_NAME___version',
  sql: '__VERSIONED_ENTITY_SQL__',
});

jest.mock('./generateTableForCurrentVersionPointer');
const generateTableForCurrentVersionPointerMock = generateTableForCurrentVersionPointer as jest.Mock;
generateTableForCurrentVersionPointerMock.mockReturnValue({
  name: '__ENTITY_NAME___cvp',
  sql: '__CURRENT_VERSION_POINTER_SQL__',
});

jest.mock('./generateMappingTablesForArrayProperties');
const generateMappingTablesForArrayPropertiesMock = generateMappingTablesForArrayProperties as jest.Mock;
generateMappingTablesForArrayPropertiesMock.mockReturnValue({
  name: '__MAPPING_TABLE__',
  sql: '__MAPPING_TABLE_SQL__',
});

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
  it('should generateTableForCurrentVersionPointer', () => {
    generateEntityTables({ entity: user });
    expect(generateTableForCurrentVersionPointerMock.mock.calls.length).toEqual(1);
  });
  it('should generateMappingTablesForArrayProperties for the array properties only', () => {
    const language = new ValueObject({
      name: 'language',
      properties: {
        name: prop.VARCHAR(255),
      },
    });
    const producer = new ValueObject({
      name: 'producer',
      properties: {
        name: prop.VARCHAR(255),
      },
    });
    const movie = new Entity({
      name: 'movie',
      properties: {
        data_source: prop.VARCHAR(255),
        external_id: prop.UUID(),
        name: prop.VARCHAR(255),
        producer_ids: prop.ARRAY_OF(prop.REFERENCES(producer)),
        language_ids: {
          ...prop.ARRAY_OF(prop.REFERENCES(language)),
          updatable: true, // the languages a movie is available in can change over time
        },
      },
      unique: ['data_source', 'external_id'],
    });
    generateEntityTables({ entity: movie });
    expect(generateMappingTablesForArrayPropertiesMock).toHaveBeenCalledTimes(1);
    expect(generateMappingTablesForArrayPropertiesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: {
          producer_ids: movie.properties.producer_ids,
          language_ids: movie.properties.language_ids,
        },
      }),
    );
  });
});
