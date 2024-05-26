import { DataTypeName } from '../constants';
import { DataType } from './DataType';
import { Literal } from './Literal';
import { Property } from './Property';

describe('Literal', () => {
  const type = new DataType({
    name: DataTypeName.VARCHAR,
    precision: 255,
  });
  it('should be possible to initialize with valid data', () => {
    const address = new Literal({
      name: 'address',
      properties: {
        name: new Property({
          type,
          updatable: false,
          nullable: true,
        }),
      },
    });
    expect(address).toBeInstanceOf(Literal);
  });
  it('should throw an error if the property is "updatable"', () => {
    try {
      // tslint:disable-next-line: no-unused-expression
      new Literal({
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
        'literals can not have updateable properties, by definition',
      );
    }
  });
});
