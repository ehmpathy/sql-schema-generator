import { DataTypeName, Entity, Property, ValueObject } from '../../types';
import * as prop from './defineProperty';

describe('generateProperty', () => {
  it('should be possible to create a uuid data type', () => {
    const property = prop.UUID();
    expect(property.constructor).toEqual(Property);
    expect(property.type).toMatchObject({
      name: DataTypeName.CHAR,
      precision: 36,
    });
  });
  it('should be possible to create an enum data type', () => {
    const property = prop.ENUM(['this', 'or', 'otherwise']);
    expect(property.constructor).toEqual(Property);
    expect(property.type).toMatchObject({
      name: DataTypeName.ENUM,
      values: ['this', 'or', 'otherwise'] as any,
    });
  });
  it('should be possible to create a varchar data type', () => {
    const property = prop.VARCHAR(255);
    expect(property.constructor).toEqual(Property);
    expect(property.type).toMatchObject({
      name: DataTypeName.VARCHAR,
      precision: 255,
    });
  });
  it('should throw an error if entity REFERENCES_VERSION of a non-updatable entity', () => {
    const apple = new ValueObject({
      name: 'apple',
      properties: {
        name: prop.VARCHAR(255), // e.g., Granny Smith
      },
    });
    try {
      prop.REFERENCES_VERSION(apple);
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        'REFERENCES_VERSION can only be applied to an entity that has updatable properties',
      );
    }
  });
  describe('use cases', () => {
    it('should make it convenient to define a real use case', () => {
      const plan = new Entity({
        name: 'plan',
        properties: {
          idea_uuid: prop.UUID(),
          request_uuid: prop.UUID(), // for idempotency
        },
        unique: ['idea_uuid', 'request_uuid'],
      });
      const participant = new Entity({
        name: 'participant',
        properties: {
          plan_id: prop.REFERENCES(plan),
          user_uuid: prop.UUID(),
          status: {
            ...prop.ENUM(['GOING', 'PENDING', 'NOT_GOING']),
            updatable: true,
          },
          reason: {
            ...prop.ENUM(['FOUND', 'WAS_INVITED_TO', 'CREATED', 'NOTIFIED']),
            updatable: true,
            comment: 'read as "${reason} the plan"',
          },
        },
        unique: ['plan_id', 'user_uuid'],
      });
      expect(participant.constructor).toEqual(Entity);
    });
    it('should make it convenient to define another real use case', () => {
      const chat = new Entity({
        name: 'chat',
        properties: {
          room_uuid: prop.UUID(),
        },
        unique: ['room_uuid'],
      });
      const message = new Entity({
        name: 'message',
        properties: {
          chat_id: prop.REFERENCES(chat),
          content: prop.TEXT(),
          user_uuid: prop.UUID(),
        },
        unique: ['chat_id', 'content', 'user_uuid'],
      });
      const like = new Entity({
        name: 'like',
        properties: {
          message_id: prop.REFERENCES(message),
          user_uuid: prop.UUID(),
        },
        unique: ['message_id', 'user_uuid'],
      });
      expect(like.constructor).toEqual(Entity);
    });
  });
});
