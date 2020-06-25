/*
  purpose: provide convenient tools to define types
*/
import { DataType, DataTypeName, Entity, Property } from '../../types';

/**
 * SMALLINT: requires 2 bytes of storage. Range [-32,768, 32,768].
 *
 * https://www.postgresql.org/docs/9.5/datatype-numeric.html
 */
export const SMALLINT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.SMALLINT,
    }),
  });

/**
 * INT: requires 4 bytes of storage. Range [-2,147,483,648, 2,147,483,647].
 *
 * https://www.postgresql.org/docs/9.5/datatype-numeric.html
 */
export const INT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.INT,
    }),
  });

/**
 * BIGINT: requires 8 bytes of storage. Range [-2^63, 2^63-1].
 *
 * https://www.postgresql.org/docs/9.5/datatype-numeric.html
 */
export const BIGINT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.BIGINT,
    }),
  });

/**
 * BIGSERIAL: requires 8 bytes of storage. Range [0, 2^63-1].
 *
 * The postgres SERIAL datatype provides a convenient way to define auto incrementing columns, for use as unique ids.
 *
 * Only the BIGSERIAL type is exposed by this library, as it is best practice in the large majority of use cases to simply always use a BIGINT for auto incrementing ids.
 *
 * https://www.postgresql.org/docs/9.5/datatype-numeric.html
 */
export const BIGSERIAL = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.BIGSERIAL,
    }),
  });

/**
 * The NUMERIC type stores exact numeric data values. These types are used when it is important to preserve exact precision.
 *
 * Precision represents the number of significant digits that are stored in total. Scale represents the number of digits following the decimal point.
 *
 * Example: the range of DECIMAL(5,2) is [-999.99, 999.99], since 5 is the precision and 2 is the scale.
 *
 * https://www.postgresql.org/docs/9.5/datatype-numeric.html
 */
export const NUMERIC = (precision: number, scale: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.NUMERIC,
      precision,
      scale,
    }),
  });

/**
 * The REAL type represents approximate numeric data values.
 *
 * REAL requires 4 bytes.
 *
 * On most platforms, the REAL type has a range of at least 1E-37 to 1E+37 with a precision of at least 6 decimal digits.
 *
 * https://www.postgresql.org/docs/9.5/datatype-numeric.html
 */
export const REAL = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.REAL,
    }),
  });

/**
 * The DOUBLE_PRECISION type represents approximate numeric data values.
 *
 * DOUBLE_PRECISION requires 8 bytes.
 *
 * On most platforms, the DOUBLE_PRECISION type has a range of around 1E-307 to 1E+308 with a precision of at least 15 digits.
 *
 * https://www.postgresql.org/docs/9.5/datatype-numeric.html
 */
export const DOUBLE_PRECISION = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.DOUBLE_PRECISION,
    }),
  });

/**
 * UUID: requires 16 bytes of storage
 *
 * Note: this is half the size of CHAR(36) (36 bytes), which would otherwise be required to store a uuid
 *
 * https://stackoverflow.com/a/29882952/3068233
 * https://www.postgresql.org/docs/10/datatype-uuid.html
 */
export const UUID = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.UUID,
    }),
  });

/**
 * VARCHAR(n) requires a variable storage size. Precision, n, defines the maximum number of characters you want to store.
 *
 * If you dont need to limit the size of strings in this column, consider using the TEXT type instead.
 *
 * VARCHAR values are stored with a 1-byte prefix plus data, if they're up to 126 bytes. Strings larger than this will have a 4 byte prefix. Long strings are compressed automatically, so physical requirement on disk may be less.
 *
 * The longest possible string that can be stored is about 1GB.
 *
 * https://www.postgresql.org/docs/10/datatype-character.html
 */
export const VARCHAR = (precision?: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.VARCHAR,
      precision,
    }),
  });

/**
 * TEXT requires a variable storage size.
 *
 * TEXT values are stored with a 1-byte prefix plus data, if they're up to 126 bytes. Strings larger than this will have a 4 byte prefix. Long strings are compressed automatically, so physical requirement on disk may be less.
 *
 * The longest possible string that can be stored is about 1GB.
 *
 * https://www.postgresql.org/docs/10/datatype-character.html
 */
export const TEXT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.TEXT,
    }),
  });

/**
 * CHAR is implemented in this library as an alias for VARCHAR.
 *
 * This is because, per the postgres docs, using CHAR in postgres does not help with storage costs and  actually hurts performance:
 * > While character(n) has performance advantages in some other database systems, there is no such advantage in PostgreSQL; in fact character(n) is usually the slowest of the three because of its additional storage costs. In most situations text or character varying should be used instead.
 *
 * VARCHAR values are stored with a 1-byte prefix plus data, if they're up to 126 bytes. Strings larger than this will have a 4 byte prefix. Long strings are compressed automatically, so physical requirement on disk may be less.
 *
 * https://www.postgresql.org/docs/10/datatype-character.html
 */
export const CHAR = (precision: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.VARCHAR,
      precision,
    }),
  });

/**
 * ENUM is implemented in this library as an alias for VARCHAR with a check constraint to enforce that values are in the enum
 *
 * Although postgres supports enum types natively, this we recommend using a check constraint for easier maintenance.
 */
export const ENUM = (values: string[]) =>
  new Property({
    type: new DataType({
      name: DataTypeName.VARCHAR,
    }),
    check: `($COLUMN_NAME IN (${values.map((value) => `'${value}'`).join(', ')}))`, // $COLUMN_NAME is replaced with the name of the column, at DDL output time
  });

/**
 * BYTEA, aka byte array, allows storage of binary strings.
 *
 * BYTEA requires a variable storage size.
 *
 * BYTEA values are stored with a 1-byte or 4-byte prefix plus data.
 *
 * https://www.postgresql.org/docs/10/datatype-binary.html
 */
export const BYTEA = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.BYTEA,
    }),
  });

/**
 * TIMESTAMP stores both date and time (no time zone). Range: [4713 BC, 294276 AD]. Resolution: 1 microsecond.
 *
 * TIMESTAMP supports an optional precision value p which specifies the number of fractional digits retained in the seconds field. By default, there is no explicit bound on precision. The allowed range of p is from 0 to 6.
 *
 * TIMESTAMP requires 8 bytes of storage.
 *
 * Note: in most cases, you probably want to use TIMESTAMPTZ, instead. Here is a great explanation for when and why you may actually want to use TIMESTAMP (without timezone): https://dba.stackexchange.com/a/158003/75296
 *
 * https://www.postgresql.org/docs/10/datatype-datetime.html
 */
export const TIMESTAMP = (precision?: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.TIMESTAMP,
      precision,
    }),
  });

/**
 * TIMESTAMPTZ stores both date and time (with time zone). Range: [4713 BC, 294276 AD]. Resolution: 1 microsecond.
 *
 * TIMESTAMPTZ is an alias for TIMESTAMP WITH TIME ZONE.
 *
 * TIMESTAMPTZ values are stored in UTC:
 * > For timestamp with time zone, the internally stored value is always in UTC (Universal Coordinated Time, traditionally known as Greenwich Mean Time, GMT). An input value that has an explicit time zone specified is converted to UTC using the appropriate offset for that time zone. If no time zone is stated in the input string, then it is assumed to be in the time zone indicated by the system's TimeZone parameter, and is converted to UTC using the offset for the timezone zone.
 *
 * TIMESTAMPTZ values are returned in the local timezone:
 * > When a timestamp with time zone value is output, it is always converted from UTC to the current timezone zone, and displayed as local time in that zone. To see the time in another time zone, either change timezone or use the AT TIME ZONE construct (see Section 9.9.3).
 *
 * TIMESTAMPTZ supports an optional precision value p which specifies the number of fractional digits retained in the seconds field. By default, there is no explicit bound on precision. The allowed range of p is from 0 to 6.
 *
 * TIMESTAMPTZ requires 8 bytes of storage.
 *
 * https://www.postgresql.org/docs/10/datatype-datetime.html
 */
export const TIMESTAMPTZ = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.TIMESTAMPTZ,
    }),
  });

/**
 * TIME stores the time of day (no date). Range: [00:00:00, 24:00:00]. Resolution: 1 microsecond.
 *
 * TIME requires 4 bytes of storage.
 *
 * TIME supports an optional precision value p which specifies the number of fractional digits retained in the seconds field. By default, there is no explicit bound on precision. The allowed range of p is from 0 to 6.
 *
 */
export const TIME = (precision?: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.TIME,
      precision,
    }),
  });

/**
 * DATE stores the date (no time of day). Range: [4713 BC, 5874897 AD]. Resolution: 1 day.
 *
 * DATE requires 4 bytes of storage.
 */
export const DATE = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.DATE,
    }),
  });

/**
 * REFERENCES creates a column which has a Foreign Key constraint to the `entity`.
 */
export const REFERENCES = (entity: Entity) =>
  new Property({
    ...BIGINT(), // pk type is always a bigint
    references: entity.name, // name of entity's table
  });

/**
 * REFERENCES_VERSION creates a column which has a Foreign Key constraint to the `entity_version`.
 *
 * NOTE: this is only valid if the referenced entity has updatable properties, as otherwise there will not be a version table for the entity.
 */
export const REFERENCES_VERSION = (entity: Entity) => {
  const referencedEntityHasUpdatableProperties = Object.values(entity.properties).some((prop) => !!prop.updatable);
  if (!referencedEntityHasUpdatableProperties) {
    throw new Error('REFERENCES_VERSION can only be applied to an entity that has updatable properties');
  }
  return new Property({
    ...BIGINT(), // pk type is always a bigint
    references: `${entity.name}_version`, // name of entity's version table
  });
};

/**
 * ARRAY_OF is an alias which sets the array flag to true on a property.
 *
 * This flag tells the generator to create a mapping table and to expect to write and read an array of these values. It results in the addition of a BINARY(32) column to the base table on which uniqueness can be defined.
 *
 * NOTE: currently only arrays of REFERENCEs are supported, meaning that the data in the array must be normalized into its own table.
 */
export const ARRAY_OF = (property: Property) => {
  if (!property.references) throw new Error('only arrays of REFERENCES are supported');
  return new Property({ ...property, array: true });
};
