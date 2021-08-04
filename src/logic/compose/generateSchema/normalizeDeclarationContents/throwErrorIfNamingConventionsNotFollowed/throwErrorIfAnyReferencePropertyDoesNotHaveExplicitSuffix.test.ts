import { Entity, ValueObject } from '../../../../../domain';
import { prop } from '../../../../define';
import { throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix } from './throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix';

describe('throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix', () => {
  it('should throw an error if property references another but does not have correct name', () => {
    const photo = new ValueObject({
      name: 'photo',
      properties: { url: prop.VARCHAR(255) },
    });
    const user = new Entity({
      name: 'user',
      properties: { name: prop.VARCHAR(255), avatar: prop.REFERENCES(photo) },
      unique: ['name'],
    });
    try {
      throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix({ entity: user });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        "property 'avatar' of entity 'user' must end with '_id' since it references another entity.",
      );
    }
  });
  it('should throw an error if an array property references another but does not have correct name', () => {
    const photo = new ValueObject({
      name: 'photo',
      properties: { url: prop.VARCHAR(255) },
    });
    const user = new Entity({
      name: 'user',
      properties: { name: prop.VARCHAR(255), pics: prop.ARRAY_OF(prop.REFERENCES(photo)) },
      unique: ['name'],
    });
    try {
      throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix({ entity: user });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        "property 'pics' of entity 'user' must end with '_ids' since it references other entities.",
      );
    }
  });
  it('should not throw an error for an entity with correctly named reference properties', () => {
    const photo = new ValueObject({
      name: 'photo',
      properties: { url: prop.VARCHAR(255) },
    });
    const user = new Entity({
      name: 'user',
      properties: {
        name: prop.VARCHAR(255),
        avatar_id: prop.REFERENCES(photo),
        pic_ids: prop.ARRAY_OF(prop.REFERENCES(photo)),
      },
      unique: ['name'],
    });
    throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix({ entity: user });
  });
});
