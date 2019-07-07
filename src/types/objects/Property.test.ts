import { DataTypeName } from '../constants';
import { DataType } from './DataType';
import { Entity } from './Entity';
import { Property } from './Property';

describe('Property', () => {
  const type = new DataType({
    name: DataTypeName.VARCHAR,
    precision: 255,
  });
  it('should be able to define a basic property', () => {
    const property = new Property({
      type,
    });
    expect(property.type).toEqual(type);
  });
  it('should be able to define a property with flags', () => {
    const property = new Property({
      type,
      updatable: true,
      nullable: true,
    });
    expect(property).toMatchObject({
      updatable: true,
      nullable: true,
    });
  });
  it('should be able to define a fk property', () => {
    const user = new Entity({
      name: 'user',
      properties: {
        name: new Property({
          type,
          updatable: true,
          nullable: true,
        }),
      },
    });
    const property = new Property({
      type,
      references: user,
    });
    expect(property.references).toEqual(user);
  });
});
