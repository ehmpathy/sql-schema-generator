import { Entity } from '../../../../../domain';
import { prop } from '../../../../define';
import { throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix } from './throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix';

describe('throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix', () => {
  it('should throw an error if property is a uuid but does not have correct name', () => {
    const user = new Entity({
      name: 'user',
      properties: { name: prop.VARCHAR(255), avatar_image_id: prop.UUID() }, // require that folks are explicit. its not an int id. its a uuid
      unique: ['name'],
    });
    try {
      throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix({ entity: user });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        "property 'avatar_image_id' of entity 'user' must end with '_uuid' since it should be explicit about being a uuid.",
      );
    }
  });
  it('should throw an error if an array property holds uuids but does not have correct name', () => {
    const user = new Entity({
      name: 'user',
      properties: {
        name: prop.VARCHAR(255),
        pic_uuid: prop.ARRAY_OF(prop.UUID()),
      },
      unique: ['name'],
    });
    try {
      throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix({ entity: user });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        "property 'pic_uuid' of entity 'user' must end with '_uuids' since it should be explicit about being an array of uuids.",
      );
    }
  });
  it('should not throw an error for an entity with correctly named uuid properties', () => {
    const user = new Entity({
      name: 'user',
      properties: {
        name: prop.VARCHAR(255),
        avatar_uuid: prop.UUID(),
        pic_uuids: prop.ARRAY_OF(prop.UUID()),
      },
      unique: ['name'],
    });
    throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix({ entity: user });
  });
});
