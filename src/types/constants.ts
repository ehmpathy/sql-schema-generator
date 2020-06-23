export enum DataTypeName {
  // https://www.postgresql.org/docs/10/datatype-numeric.html
  SMALLINT = 'smallint', // 2 bytes
  INT = 'int', // 4 bytes
  BIGINT = 'bigint', // 8 bytes

  SMALLSERIAL = 'smallserial', // 2 bytes
  SERIAL = 'serial', // 4 bytes
  BIGSERIAL = 'bigserial', // 8 bytes

  NUMERIC = 'numeric',
  DECIMAL = 'decimal', // alias for numeric

  REAL = 'real',
  DOUBLE_PRECISION = 'double precision',

  // https://www.postgresql.org/docs/10/datatype-character.html
  CHAR = 'char',
  VARCHAR = 'varchar',
  TEXT = 'text',

  // https://www.postgresql.org/docs/10/datatype-binary.html
  BYTEA = 'bytea', // variable length binary string

  // https://www.postgresql.org/docs/10/datatype-datetime.html
  TIMESTAMP = 'timestamp',
  TIMESTAMP_WITH_TIME_ZONE = 'timestamptz',
  TIME = 'time',
  TIME_WITH_TIME_ZONE = 'timetz',
  DATE = 'date',

  // https://www.postgresql.org/docs/10/datatype-boolean.html
  BOOLEAN = 'boolean',

  // https://www.postgresql.org/docs/10/datatype-textsearch.html
  UUID = 'uuid',
}

export enum Constraint {
  FOREIGN_KEY = 'FOREIGN_KEY',
}
