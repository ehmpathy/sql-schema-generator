import { DataType, DataTypeName, Entity, Property } from '../../types';
/*
  provide convinient tools to define types
*/

// string types
export const UUID = () => new Property({
  type: new DataType({
    name: DataTypeName.UUID,
  }),
});
export const ENUM = (values: string[]) => new Property({
  type: new DataType({
    name: DataTypeName.ENUM,
    values,
  }),
});
export const VARCHAR = (precision: number) => new Property({
  type: new DataType({
    name: DataTypeName.VARCHAR,
    precision,
  }),
});
export const TEXT = () => new Property({
  type: new DataType({
    name: DataTypeName.TEXT,
  }),
});

// numeric types
export const BIGINT = () => new Property({
  type: new DataType({
    name: DataTypeName.BIGINT,
  }),
});

// foreign keys
export const REFERENCES = (entity: Entity) => new Property({
  ...BIGINT(), // pk type is always a bigint
  references: entity,
});

// checks; TODO
