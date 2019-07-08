import { DataType, DataTypeName, Entity, Property } from '../../types';
/*
  provide convinient tools to define types
*/

// string types
export const UUID = () => new Property({
  type: new DataType({
    name: DataTypeName.CHAR,
    precision: 36,
  }),
  // TODO: add check
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
export const INT = () => new Property({
  type: new DataType({
    name: DataTypeName.INT,
    precision: 11,
  }),
});
export const BIGINT = (precision: number) => new Property({
  type: new DataType({
    name: DataTypeName.BIGINT,
    precision,
  }),
});

// datetime types
export const DATETIME = (precision: number) => new Property({
  type: new DataType({
    name: DataTypeName.DATETIME,
    precision,
  }),
});

// other types
export const BINARY = (precision: number) => new Property({
  type: new DataType({
    name: DataTypeName.BINARY,
    precision,
  }),
});

// foreign keys
export const REFERENCES = (entity: Entity) => new Property({
  ...BIGINT(20), // pk type is always a bigint
  references: entity.name, // name of entity
});

// checks; TODO
