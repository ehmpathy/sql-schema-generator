import { DataTypeName, Entity, Literal, Property } from '@src/domain.objects';

import * as prop from './defineProperty';

describe('generateProperty', () => {
  it('should be possible to create a uuid data type', () => {
    const property = prop.UUID();
    expect(property.constructor).toEqual(Property);
    expect(property.type).toMatchObject({
      name: DataTypeName.UUID,
    });
  });
  it('should be possible to create an enum data type', () => {
    const property = prop.ENUM(['this', 'or', 'otherwise']);
    expect(property.constructor).toEqual(Property);
    expect(property.type).toMatchObject({
      name: DataTypeName.VARCHAR,
    });
    expect(property.check).toEqual(
      "($COLUMN_NAME IN ('this', 'or', 'otherwise'))",
    );
  });
  it('should be possible to create a varchar data type', () => {
    const property = prop.VARCHAR(255);
    expect(property.constructor).toEqual(Property);
    expect(property.type).toMatchObject({
      name: DataTypeName.VARCHAR,
      precision: 255,
    });
  });
  describe('ARRAY_OF', () => {
    it('should accept a primitive VARCHAR element and set the array flag', () => {
      const property = prop.ARRAY_OF(prop.VARCHAR());
      expect(property.array).toEqual(true);
      expect(property.type).toMatchObject({ name: DataTypeName.VARCHAR });
      expect(property.references).toEqual(undefined);
    });
    it('should accept a primitive NUMERIC element and set the array flag', () => {
      const property = prop.ARRAY_OF(prop.NUMERIC());
      expect(property.array).toEqual(true);
      expect(property.type).toMatchObject({ name: DataTypeName.NUMERIC });
    });
    it('should accept a primitive BOOLEAN element and set the array flag', () => {
      const property = prop.ARRAY_OF(prop.BOOLEAN());
      expect(property.array).toEqual(true);
      expect(property.type).toMatchObject({ name: DataTypeName.BOOLEAN });
    });
    it('should accept a primitive TIMESTAMPTZ element and set the array flag', () => {
      const property = prop.ARRAY_OF(prop.TIMESTAMPTZ());
      expect(property.array).toEqual(true);
      expect(property.type).toMatchObject({ name: DataTypeName.TIMESTAMPTZ });
    });
    it('should recast the enum scalar IN check into an element-membership check for the array', () => {
      const property = prop.ARRAY_OF(
        prop.ENUM(['ACTIVE', 'FAULTED', 'OFFLINE']),
      );
      expect(property.array).toEqual(true);
      expect(property.type).toMatchObject({ name: DataTypeName.VARCHAR });
      expect(property.check).toEqual(
        "($COLUMN_NAME <@ ARRAY['ACTIVE', 'FAULTED', 'OFFLINE']::varchar[])",
      );
    });
    it('should keep a REFERENCES element on the join-table path, unchanged', () => {
      const zone = new Entity({
        name: 'zone',
        properties: { name: prop.VARCHAR() },
        unique: ['name'],
      });
      const property = prop.ARRAY_OF(prop.REFERENCES(zone));
      expect(property.array).toEqual(true);
      expect(property.references).toEqual('zone');
    });
    it('should keep a UUID element on the join-table path, unchanged', () => {
      const property = prop.ARRAY_OF(prop.UUID());
      expect(property.array).toEqual(true);
      expect(property.type).toMatchObject({ name: DataTypeName.UUID });
      expect(property.check).toEqual(undefined);
    });
    it('should throw at declare time for a serial pseudo-type element', () => {
      try {
        prop.ARRAY_OF(prop.BIGSERIAL());
        throw new Error('should not reach here');
      } catch (error) {
        expect(error.message).toContain(
          "does not support the serial pseudo-type 'bigserial'",
        );
        expect(error.message).toContain('prop.BIGINT()');
        expect(error.message).toMatchSnapshot(); // the exact declare-time error a developer sees
      }
    });
    // data-driven proof that ARRAY_OF accepts every documented primitive element type,
    // not just the five the round-trip integration test exercises
    const PRIMITIVE_ELEMENT_CASES = [
      { description: 'SMALLINT', element: prop.SMALLINT() },
      { description: 'INT', element: prop.INT() },
      { description: 'BIGINT', element: prop.BIGINT() },
      { description: 'NUMERIC', element: prop.NUMERIC() },
      { description: 'REAL', element: prop.REAL() },
      { description: 'DOUBLE_PRECISION', element: prop.DOUBLE_PRECISION() },
      { description: 'CHAR', element: prop.CHAR(3) },
      { description: 'VARCHAR', element: prop.VARCHAR() },
      { description: 'TEXT', element: prop.TEXT() },
      { description: 'BYTEA', element: prop.BYTEA() },
      { description: 'TIMESTAMP', element: prop.TIMESTAMP() },
      { description: 'TIMESTAMPTZ', element: prop.TIMESTAMPTZ() },
      { description: 'TIME', element: prop.TIME() },
      { description: 'DATE', element: prop.DATE() },
      { description: 'BOOLEAN', element: prop.BOOLEAN() },
    ];
    PRIMITIVE_ELEMENT_CASES.map((thisCase) =>
      it(`should accept a ${thisCase.description} element and set the array flag`, () => {
        const property = prop.ARRAY_OF(thisCase.element);
        expect(property.array).toEqual(true);
        expect(property.references).toEqual(undefined);
        expect(property.type.name).toEqual(thisCase.element.type.name);
      }),
    );
    it('should preserve the precision + scale of a NUMERIC element when arrayed', () => {
      const property = prop.ARRAY_OF(prop.NUMERIC(10, 2));
      expect(property.array).toEqual(true);
      expect(property.type).toMatchObject({
        name: DataTypeName.NUMERIC,
        precision: 10,
        scale: 2,
      });
    });
    it('should throw at declare time for an already-arrayed (nested) element', () => {
      try {
        prop.ARRAY_OF(prop.ARRAY_OF(prop.VARCHAR()));
        throw new Error('should not reach here');
      } catch (error) {
        expect(error.message).toContain(
          'cannot be applied to an already-arrayed property',
        );
        expect(error.message).toMatchSnapshot();
      }
    });
    it('should throw at declare time for a custom (non-enum) check element', () => {
      const customChecked = new Property({
        ...prop.VARCHAR(),
        check: "($COLUMN_NAME ~ '^SN')",
      });
      try {
        prop.ARRAY_OF(customChecked);
        throw new Error('should not reach here');
      } catch (error) {
        expect(error.message).toContain('only supports the ENUM check shape');
        expect(error.message).toMatchSnapshot(); // the exact declare-time error a developer sees
      }
    });
  });
  it('should throw an error if entity REFERENCES_VERSION of a non-updatable entity', () => {
    const apple = new Literal({
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
