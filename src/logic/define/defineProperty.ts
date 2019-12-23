/*
  purpose: provide convenient tools to define types
*/
import { DataType, DataTypeName, Entity, Property } from '../../types';

/**
 * TINYINT: requires 1 byte of storage. Unsigned range [-128, 127]. Signed range [0, 255].
 *
 * https://dev.mysql.com/doc/refman/5.7/en/integer-types.html
 */
export const TINYINT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.TINYINT,
      precision: 4,
    }),
  });

/**
 * SMALLINT: requires 2 bytes of storage. Unsigned range [-32,768, 32,768]. Signed range [0, 65,535].
 *
 * https://dev.mysql.com/doc/refman/5.7/en/integer-types.html
 */
export const SMALLINT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.SMALLINT,
      precision: 6,
    }),
  });

/**
 * MEDIUMINT: requires 3 bytes of storage. Unsigned range [-8,388,608, 8,388,607]. Signed range [0, 16,777,215].
 *
 * https://dev.mysql.com/doc/refman/5.7/en/integer-types.html
 */
export const MEDIUMINT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.MEDIUMINT,
      precision: 9,
    }),
  });

/**
 * INT: requires 4 bytes of storage. Unsigned range [-2,147,483,648, 2,147,483,647]. Signed range [0, 4,294,967,295].
 *
 * https://dev.mysql.com/doc/refman/5.7/en/integer-types.html
 */
export const INT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.INT,
      precision: 11,
    }),
  });

/**
 * BIGINT: requires 8 bytes of storage. Unsigned range [-2^63, 2^63-1]. Signed range [0, 2^64-1].
 *
 * https://dev.mysql.com/doc/refman/5.7/en/integer-types.html
 */
export const BIGINT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.BIGINT,
      precision: 20,
    }),
  });

/**
 * The DECIMAL type stores exact numeric data values. These types are used when it is important to preserve exact precision, for example with monetary data.
 *
 * Precision represents the number of significant digits that are stored in total. Scale represents the number of digits following the decimal point.
 *
 * Example: the range of DECIMAL(5,2) is [-999.99, 999.99], since 5 is the precision and 2 is the scale.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/fixed-point-types.html
 */
export const DECIMAL = (precision: number, scale: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.DECIMAL,
      precision,
      scale,
    }),
  });

/**
 * The FLOAT type represents approximate numeric data values.
 *
 * FLOAT requires 4 bytes.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/floating-point-types.html
 */
export const FLOAT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.FLOAT,
    }),
  });

/**
 * The DOUBLE type represents approximate numeric data values.
 *
 * DOUBLE requires 8 bytes.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/floating-point-types.html
 */
export const DOUBLE = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.DOUBLE,
    }),
  });

/**
 * The BIT data type is used to store bit values. A type of BIT(M) enables storage of M-bit values. M can range from 1 to 64.
 *
 * If you assign a value to a BIT(M) column that is less than M bits long, the value is padded on the left with zeros. For example, assigning a value of b'101' to a BIT(6) column is, in effect, the same as assigning b'000101'.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/bit-type.html
 */
export const BIT = (precision: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.BIT,
      precision,
    }),
  });

/**
 * UUID is an alias for CHAR(36)
 */
export const UUID = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.CHAR,
      precision: 36,
    }),
    // TODO: add check for proper uuid format
  });

/**
 * An ENUM is a string object with a value chosen from a list of permitted values that are enumerated explicitly in the column specification at table creation time.
 *
 * WARNING: An enumeration value can also be the empty string ('') or NULL under certain circumstances, per MySQL documentation (!). Only if strict SQL mode is enabled, attempts to insert invalid ENUM values result in an error.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/enum.html
 */
export const ENUM = (values: string[]) =>
  new Property({
    type: new DataType({
      name: DataTypeName.ENUM,
      values,
    }),
  });

/**
 * CHAR(n) requires n bytes. Precision defines the maximum number of characters you want to store. Range of precision: [0, 255].
 *
 * When CHAR values are stored, they are right-padded with spaces to the specified length. When CHAR values are retrieved, trailing spaces are removed unless the PAD_CHAR_TO_FULL_LENGTH SQL mode is enabled.
 *
 * WARNING: If strict SQL mode is not enabled and you assign a value to a CHAR column that exceeds the column's maximum length, the value is truncated to fit and a warning is generated.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/char.html
 */
export const CHAR = (precision: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.VARCHAR,
      precision,
    }),
  });

/**
 * VARCHAR requires a variable storage size. Precision defines the maximum number of characters you want to store. Range of precision: [0, 65,535].
 *
 * VARCHAR values are stored as a 1-byte or 2-byte length prefix plus data. The length prefix indicates the number of bytes in the value. A column uses one length byte if values require no more than 255 bytes, two length bytes if values may require more than 255 bytes.
 *
 * WARNING: If strict SQL mode is not enabled and you assign a value to a VARCHAR column that exceeds the column's maximum length, the value is truncated to fit and a warning is generated.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/char.html
 */
export const VARCHAR = (precision: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.VARCHAR,
      precision,
    }),
  });

/**
 * TINYTEXT requires L + 1 bytes, where L < 2^8. (2^8 = 256)
 *
 * https://dev.mysql.com/doc/refman/5.7/en/blob.html
 */
export const TINYTEXT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.TINYTEXT,
    }),
  });

/**
 * TEXT requires L + 2 bytes, where L < 2^16. (2^16 = 65,536)
 *
 * https://dev.mysql.com/doc/refman/5.7/en/blob.html
 */
export const TEXT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.TEXT,
    }),
  });

/**
 * TEXT requires L + 3 bytes, where L < 2^24. (2^32 = 16,777,216)
 *
 * https://dev.mysql.com/doc/refman/5.7/en/blob.html
 */
export const MEDIUMTEXT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.MEDIUMTEXT,
    }),
  });

/**
 * TEXT requires L + 4 bytes, where L < 2^32. (2^32 = 4,294,967,296)
 *
 * https://dev.mysql.com/doc/refman/5.7/en/blob.html
 */
export const LONGTEXT = () =>
  new Property({
    type: new DataType({
      name: DataTypeName.LONGTEXT,
    }),
  });

/**
 * https://dev.mysql.com/doc/refman/5.7/en/binary-varbinary.html
 */
export const BINARY = (precision: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.BINARY,
      precision,
    }),
  });

/**
 * The DATETIME type is used for values that contain both date and time parts. MySQL retrieves and displays DATETIME values in 'YYYY-MM-DD hh:mm:ss' format. The supported range is '1000-01-01 00:00:00' to '9999-12-31 23:59:59'.
 *
 * DATETIME requires 8 bytes of storage.
 *
 * https://dev.mysql.com/doc/refman/5.7/en/datetime.html
 * https://dev.mysql.com/doc/refman/5.7/en/storage-requirements.html
 */
export const DATETIME = (precision: number) =>
  new Property({
    type: new DataType({
      name: DataTypeName.DATETIME,
      precision,
    }),
  });

/**
 * REFERENCES creates a column which has a Foreign Key constraint to the `entity`.
 */
export const REFERENCES = (entity: Entity) =>
  new Property({
    ...BIGINT(), // pk type is always a bigint
    references: entity.name, // name of entity
  });
