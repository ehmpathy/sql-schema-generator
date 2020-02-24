import { Entity } from '../../../../types';
import { prop } from '../../../define';
import { throwErrorIfAnyReservedPropertyNamesAreUsed } from './throwErrorIfAnyReservedPropertyNamesAreUsed';

describe('throwErrorIfAnyReservedPropertyNamesAreUsed', () => {
  it('should throw an error if has a property with a reserved name', () => {
    const user = new Entity({
      name: 'user',
      properties: {
        uuid: prop.CHAR(20), // reserved name
        phone_number: prop.VARCHAR(255),
      },
      unique: ['phone_number'],
    });
    try {
      throwErrorIfAnyReservedPropertyNamesAreUsed({ entity: user });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual('property can not be named "user.uuid" because "uuid" is a reserved property name');
    }
  });
});
