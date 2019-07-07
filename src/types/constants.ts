// NOTE: data types are data ttypes that _we_ understand. the generator logic will know how to convert them into the target language
export enum DataTypeName {
  UUID = 'UUID',
  CHAR = 'CHAR',
  VARCHAR = 'VARCHAR',
  TEXT = 'TEXT',
  ENUM = 'ENUM',

  BIGINT = 'BIGINT',
}
