import { DataTypeName } from '../constants';
import { DataType } from './DataType';
import { Event } from './Event';
import { Property } from './Property';

describe('Event', () => {
  const type = new DataType({
    name: DataTypeName.VARCHAR,
    precision: 255,
  });
  it('should be possible to initialize with valid data', () => {
    const event = new Event({
      name: 'item_purchased_event',
      properties: {
        product_uuid: new Property({ type, updatable: false, nullable: false }),
        occurred_at: new Property({
          type,
          updatable: false,
          nullable: true,
        }),
      },
      unique: ['product_uuid'],
    });
    expect(event).toBeInstanceOf(Event);
  });
  it('should throw an error if a property is "updatable"', () => {
    try {
      // tslint:disable-next-line: no-unused-expression
      new Event({
        name: 'item_purchased_event',
        properties: {
          product_uuid: new Property({ type, updatable: false, nullable: false }),
          occurred_at: new Property({
            type,
            updatable: true,
            nullable: true,
          }),
        },
        unique: ['product_uuid'],
      });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual('events can not have updateable properties, by definition');
    }
  });
});
