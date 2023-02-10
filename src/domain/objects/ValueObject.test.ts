import { DataTypeName } from '../constants';
import { DataType } from './DataType';
import { Property } from './Property';
import { ValueObject } from './ValueObject';

describe('ValueObject', () => {
  const type = new DataType({
    name: DataTypeName.VARCHAR,
    precision: 255,
  });
  it('should be possible to initialize with valid data', () => {
    const address = new ValueObject({
      name: 'address',
      properties: {
        name: new Property({
          type,
          updatable: false,
          nullable: true,
        }),
      },
    });
    expect(address).toBeInstanceOf(ValueObject);
  });
  it('should throw an error if the property is "updatable"', () => {
    try {
      // tslint:disable-next-line: no-unused-expression
      new ValueObject({
        name: 'address',
        properties: {
          name: new Property({
            type,
            updatable: true,
            nullable: true,
          }),
        },
      });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        'value objects can not have updateable properties, by definition',
      );
    }
  });
});
