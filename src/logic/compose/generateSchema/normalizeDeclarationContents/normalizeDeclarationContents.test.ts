import { prop } from '../../../../contract/module';
import { Entity, ValueObject } from '../../../../types';
import { normalizeDeclarationContents } from './normalizeDeclarationContents';
import { throwErrorIfAnyUniqueIsNotInProperties } from './throwErrorIfAnyUniqueIsNotInProperties';
import { throwErrorIfNamingConventionsNotFollowed } from './throwErrorIfNamingConventionsNotFollowed';

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
  it('should return the entities and value objects found in the contents', () => {
    const contents = {
      entities: [
        new Entity({ name: 'name', properties: {}, unique: [] }),
        new ValueObject({ name: 'name', properties: {} }),
      ],
    };
    const { entities } = normalizeDeclarationContents({ contents });
    expect(entities).toEqual(contents.entities);
  });
});
