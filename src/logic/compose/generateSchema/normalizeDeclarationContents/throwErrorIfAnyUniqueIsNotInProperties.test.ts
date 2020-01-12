import { prop } from '../../../../contract/module';
import { Entity } from '../../../../types';
import { throwErrorIfAnyUniqueIsNotInProperties } from './throwErrorIfAnyUniqueIsNotInProperties';

describe('throwErrorIfAnyUniqueIsNotInProperties', () => {
  it("should throw an error if entity is defined as unique on a property but that property is not defined in the entity's properties", () => {
    const user = new Entity({
      name: 'user',
      properties: {
        phone_number: prop.VARCHAR(255),
        first_name: prop.VARCHAR(255),
        last_name: prop.VARCHAR(255),
      },
      unique: ['phoneNumber'], // unique on phone number
    });
    try {
      throwErrorIfAnyUniqueIsNotInProperties({ entity: user });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        "entity 'user' was defined to be unique on 'phoneNumber' but does not have that defined in its properties",
      );
    }
  });
});
