export enum DataTypeName {
  // https://dev.mysql.com/doc/refman/5.7/en/string-types.html
  CHAR = 'char',
  VARCHAR = 'varchar',
  BINARY = 'binary',
  TINYTEXT = 'tinytext',
  TEXT = 'text',
  MEDIUMTEXT = 'mediumtext',
  LONGTEXT = 'longtext',
  ENUM = 'enum',

  // https://dev.mysql.com/doc/refman/5.7/en/integer-types.html
  TINYINT = 'tinyint',
  SMALLINT = 'smallint',
  MEDIUMINT = 'mediumint',
  INT = 'int',
  BIGINT = 'bigint',

  // https://dev.mysql.com/doc/refman/5.7/en/fixed-point-types.html
  DECIMAL = 'decimal',
  NUMERIC = 'numeric',

  // https://dev.mysql.com/doc/refman/5.7/en/floating-point-types.html
  FLOAT = 'float',
  DOUBLE = 'double',

  // https://dev.mysql.com/doc/refman/5.7/en/bit-type.html
  BIT = 'bit',

  // https://dev.mysql.com/doc/refman/5.7/en/datetime.html
  DATETIME = 'datetime',
}

export enum Constraint {
  FOREIGN_KEY = 'FOREIGN_KEY',
}
