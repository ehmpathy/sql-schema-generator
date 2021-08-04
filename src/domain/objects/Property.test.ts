import { serialize } from 'domain-objects';

import { DataTypeName } from '../constants';
import { DataType } from './DataType';
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
    const property = new Property({
      type,
      references: 'user',
    });
    expect(property.references).toEqual('user');
  });
  it('should be possible to serialize a property', () => {
    serialize(
      new Property({
        type,
      }),
    );
  });
});
