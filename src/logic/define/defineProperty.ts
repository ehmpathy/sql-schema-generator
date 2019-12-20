import { DataType, DataTypeName, Entity, Property } from '../../types';
/*
  provide convenient tools to define types
*/

// integer types: https://dev.mysql.com/doc/refman/5.7/en/integer-types.html
export const TINYINT = () => new Property({
  type: new DataType({
    name: DataTypeName.TINYINT,
    precision: 4,
  }),
});
export const SMALLINT = () => new Property({
  type: new DataType({
    name: DataTypeName.SMALLINT,
    precision: 6,
  }),
});
export const MEDIUMINT = () => new Property({
  type: new DataType({
    name: DataTypeName.MEDIUMINT,
    precision: 9,
  }),
});
export const INT = () => new Property({
  type: new DataType({
    name: DataTypeName.INT,
    precision: 11,
  }),
});
export const BIGINT = () => new Property({
  type: new DataType({
    name: DataTypeName.BIGINT,
    precision: 20,
  }),
});

// numeric and decimal types: https://dev.mysql.com/doc/refman/5.7/en/fixed-point-types.html
export const DECIMAL = (precision: number, scale: number) => new Property({
  type: new DataType({
    name: DataTypeName.DECIMAL,
    precision,
    scale,
  }),
});

// floating point types: https://dev.mysql.com/doc/refman/5.7/en/floating-point-types.html
export const FLOAT = () => new Property({
  type: new DataType({
    name: DataTypeName.FLOAT,
  }),
});
export const DOUBLE = () => new Property({
  type: new DataType({
    name: DataTypeName.DOUBLE,
  }),
});

// bit type: https://dev.mysql.com/doc/refman/5.7/en/bit-type.html
export const BIT = (precision: number) => new Property({
  type: new DataType({
    name: DataTypeName.BIT,
    precision,
  }),
});

// string types
export const UUID = () => new Property({
  type: new DataType({
    name: DataTypeName.CHAR,
    precision: 36,
  }),
  // TODO: add check for proper uuid format
});
export const ENUM = (values: string[]) => new Property({
  type: new DataType({
    name: DataTypeName.ENUM,
    values,
  }),
});
export const CHAR = (precision: number) => new Property({
  type: new DataType({
    name: DataTypeName.VARCHAR,
    precision,
  }),
});
export const VARCHAR = (precision: number) => new Property({
  type: new DataType({
    name: DataTypeName.VARCHAR,
    precision,
  }),
});
export const TINYTEXT = () => new Property({
  type: new DataType({
    name: DataTypeName.TINYTEXT,
  }),
});
export const TEXT = () => new Property({
  type: new DataType({
    name: DataTypeName.TEXT,
  }),
});
export const MEDIUMTEXT = () => new Property({
  type: new DataType({
    name: DataTypeName.MEDIUMTEXT,
  }),
});
export const LONGTEXT = () => new Property({
  type: new DataType({
    name: DataTypeName.LONGTEXT,
  }),
});
export const BINARY = (precision: number) => new Property({
  type: new DataType({
    name: DataTypeName.BINARY,
    precision,
  }),
});

// datetime types: https://dev.mysql.com/doc/refman/5.7/en/datetime.html
export const DATETIME = (precision: number) => new Property({
  type: new DataType({
    name: DataTypeName.DATETIME,
    precision,
  }),
});

// foreign keys
export const REFERENCES = (entity: Entity) => new Property({
  ...BIGINT(), // pk type is always a bigint
  references: entity.name, // name of entity
});
