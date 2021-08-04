import { DataTypeName } from '../constants';
import { DataType } from './DataType';
import { Entity } from './Entity';
import { Property } from './Property';

describe('Entity', () => {
  const type = new DataType({
    name: DataTypeName.VARCHAR,
    precision: 255,
  });
  const property = new Property({
    type,
    updatable: true,
    nullable: true,
  });
  it('should be possible to initialize with valid data', () => {
    const user = new Entity({
      name: 'user',
      properties: {
        name: property,
      },
      unique: [],
    });
    expect(user.constructor).toEqual(Entity);
  });
});
