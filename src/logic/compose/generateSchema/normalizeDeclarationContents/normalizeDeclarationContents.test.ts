import { Entity, ValueObject } from '../../../../types';
import { prop } from '../../../define';
import { normalizeDeclarationContents } from './normalizeDeclarationContents';
import { throwErrorIfAnyReservedPropertyNamesAreUsed } from './throwErrorIfAnyReservedPropertyNamesAreUsed';
import { throwErrorIfAnyUniqueIsNotInProperties } from './throwErrorIfAnyUniqueIsNotInProperties';
import { throwErrorIfNamingConventionsNotFollowed } from './throwErrorIfNamingConventionsNotFollowed';
import { throwErrorIfNotUniqueOnAnything } from './throwErrorIfNotUniqueOnAnything';

jest.mock('./throwErrorIfAnyReservedPropertyNamesAreUsed');
const throwErrorIfAnyReservedPropertyNamesAreUsedMock = throwErrorIfAnyReservedPropertyNamesAreUsed as jest.Mock;

jest.mock('./throwErrorIfNamingConventionsNotFollowed');
const throwErrorIfNamingConventionsNotFollowedMock = throwErrorIfNamingConventionsNotFollowed as jest.Mock;

jest.mock('./throwErrorIfAnyUniqueIsNotInProperties');
const throwErrorIfAnyUniqueIsNotInPropertiesMock = throwErrorIfAnyUniqueIsNotInProperties;

jest.mock('./throwErrorIfNotUniqueOnAnything');
const throwErrorIfNotUniqueOnAnythingMock = throwErrorIfNotUniqueOnAnything;

describe('normalizeDeclarationContents', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should throw an error if an entities object is not exported from the source file', () => {
    const contents = { ontities: [] };
    try {
      normalizeDeclarationContents({ contents });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        'an `entities` or `generateSqlSchemasFor` array must be exported by the source file',
      );
    }
  });
  it('throw an error if entities are not all of class Entity or ValueObject', () => {
    const contents = { entities: ['not an Entity'] };
    try {
      normalizeDeclarationContents({ contents });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual('all exported entities must be of, or extend, class Entity');
    }
  });
  it("should throw an error if any entity's properties use a reserved name", () => {
    const exampleEntity = new Entity({ name: 'burrito', properties: { lbs: prop.INT() }, unique: ['lbs'] });
    const contents = { entities: [exampleEntity] };
    normalizeDeclarationContents({ contents });
    expect(throwErrorIfAnyReservedPropertyNamesAreUsedMock).toHaveBeenCalledTimes(1);
    expect(throwErrorIfAnyReservedPropertyNamesAreUsedMock).toHaveBeenCalledWith({ entity: exampleEntity });
  });
  it("should throw an error if any entity's properties do not follow naming conventions", () => {
    const exampleEntity = new Entity({ name: 'burrito', properties: { lbs: prop.INT() }, unique: ['lbs'] });
    const contents = { entities: [exampleEntity] };
    normalizeDeclarationContents({ contents });
    expect(throwErrorIfNamingConventionsNotFollowedMock).toHaveBeenCalledTimes(1);
    expect(throwErrorIfNamingConventionsNotFollowedMock).toHaveBeenCalledWith({ entity: exampleEntity });
  });
  it('should throw an error if any keys the entity is unique on are not defined in its properties', () => {
    const exampleEntity = new Entity({ name: 'burrito', properties: { lbs: prop.INT() }, unique: ['lbs'] });
    const contents = { entities: [exampleEntity] };
    normalizeDeclarationContents({ contents });
    expect(throwErrorIfAnyUniqueIsNotInPropertiesMock).toHaveBeenCalledTimes(1);
    expect(throwErrorIfAnyUniqueIsNotInPropertiesMock).toHaveBeenCalledWith({ entity: exampleEntity });
  });
  it('should throw an error if entity is unique on nothing', () => {
    const exampleEntity = new Entity({ name: 'burrito', properties: { lbs: prop.INT() }, unique: ['lbs'] });
    const contents = { entities: [exampleEntity] };
    normalizeDeclarationContents({ contents });
    expect(throwErrorIfNotUniqueOnAnythingMock).toHaveBeenCalledTimes(1);
    expect(throwErrorIfNotUniqueOnAnythingMock).toHaveBeenCalledWith({ entity: exampleEntity });
  });
  it('should return the entities and value objects found in the contents', () => {
    const plant = new ValueObject({ name: 'plant', properties: { genus: prop.VARCHAR(255) } });
    const vase = new ValueObject({ name: 'vase', properties: { plants: prop.ARRAY_OF(prop.REFERENCES(plant)) } });
    const customer = new Entity({
      name: 'customer',
      properties: { phone_number: prop.VARCHAR(10) },
      unique: ['phone_number'], // users are unique on phone numbers
    });
    const order = new Entity({
      name: 'order',
      properties: { customer_id: prop.REFERENCES(customer), vase_id: prop.REFERENCES(vase) },
      unique: ['uuid'], // logically unique on nothing - same order can be placed many times! -> we'll require the user to pass in a uuid for idempotency
    });
    const contents = {
      entities: [plant, vase, customer, order],
    };
    const { entities } = normalizeDeclarationContents({ contents });

    // check that we return everything as expected
    expect(entities).toEqual([plant, vase, customer, order]);
  });
  it('should return the entities and value objects found in the contents - when specified with the generateSqlSchemasFor syntax', () => {
    const plant = new ValueObject({ name: 'plant', properties: { genus: prop.VARCHAR(255) } });
    const vase = new ValueObject({ name: 'vase', properties: { plants: prop.ARRAY_OF(prop.REFERENCES(plant)) } });
    const customer = new Entity({
      name: 'customer',
      properties: { phone_number: prop.VARCHAR(10) },
      unique: ['phone_number'], // users are unique on phone numbers
    });
    const order = new Entity({
      name: 'order',
      properties: { customer_id: prop.REFERENCES(customer), vase_id: prop.REFERENCES(vase) },
      unique: ['uuid'], // logically unique on nothing - same order can be placed many times! -> we'll require the user to pass in a uuid for idempotency
    });
    const contents = {
      generateSqlSchemasFor: [plant, vase, customer, order],
    };
    const { entities } = normalizeDeclarationContents({ contents });

    // check that we return everything as expected
    expect(entities).toEqual([plant, vase, customer, order]);
  });
});
