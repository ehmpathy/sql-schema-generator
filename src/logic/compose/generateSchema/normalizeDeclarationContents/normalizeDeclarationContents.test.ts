import { prop } from '../../../../contract/module';
import { Entity, ValueObject } from '../../../../types';
import { normalizeDeclarationContents } from './normalizeDeclarationContents';
import { throwErrorIfAnyReservedPropertyNamesAreUsed } from './throwErrorIfAnyReservedPropertyNamesAreUsed';
import { throwErrorIfAnyUniqueIsNotInProperties } from './throwErrorIfAnyUniqueIsNotInProperties';
import { throwErrorIfNamingConventionsNotFollowed } from './throwErrorIfNamingConventionsNotFollowed';

jest.mock('./throwErrorIfAnyReservedPropertyNamesAreUsed');
const throwErrorIfAnyReservedPropertyNamesAreUsedMock = throwErrorIfAnyReservedPropertyNamesAreUsed as jest.Mock;

jest.mock('./throwErrorIfNamingConventionsNotFollowed');
const throwErrorIfNamingConventionsNotFollowedMock = throwErrorIfNamingConventionsNotFollowed as jest.Mock;

jest.mock('./throwErrorIfAnyUniqueIsNotInProperties');
const throwErrorIfAnyUniqueIsNotInPropertiesMock = throwErrorIfAnyUniqueIsNotInProperties;

describe('normalizeDeclarationContents', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should throw an error if an entities object is not exported from the source file', () => {
    const contents = { ontities: [] };
    try {
      normalizeDeclarationContents({ contents });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual('an entities array must be exported by the source file');
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
  it("should set entities to be unique on uuid if they're unique on nothing", () => {
    const contents = {
      entities: [new Entity({ name: 'job', properties: {}, unique: [] })],
    };
    const { entities } = normalizeDeclarationContents({ contents });
    expect(entities[0].unique).toEqual(['uuid']);
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
      unique: [], // logically unique on nothing - same order can be placed many times! -> we'll require the user to pass in a uuid for idempotency
    });
    const contents = {
      entities: [plant, vase, customer, order],
    };
    const { entities } = normalizeDeclarationContents({ contents });

    // check that we return everything as expected
    expect(entities).toEqual([
      plant,
      vase,
      customer,
      new Entity({ ...order, unique: ['uuid'] }), // cast order to be unique on uuid, since we normalize this
    ]);
  });
});
