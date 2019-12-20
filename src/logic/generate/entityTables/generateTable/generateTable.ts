import { Property } from '../../../../types';
import { generateColumn } from './generateColumn';
import { generateConstraintForeignKey } from './generateConstraintForeignKey';

export const generateTable = ({
  tableName,
  properties,
  unique,
}: {
  tableName: string;
  properties: { [index: string]: Property };
  unique: string[];
}) => {
  // 0. validate input
  if (unique.length === 0) {
    throw new Error('must have atleast one unique property; otherwise, idempotency is not guarenteed');
  }

  // 1. define sql per column
  const columnSqls = Object.entries(properties).map((entry) =>
    generateColumn({ columnName: entry[0], property: entry[1] }),
  );
  const foreignKeySqls = Object.entries(properties)
    .filter((entity) => !!entity[1].references)
    .map((entry, index) =>
      generateConstraintForeignKey({ index, columnName: entry[0], tableName, property: entry[1] }),
    );
  const foreignKeyKeySqls = foreignKeySqls.map((sqls) => sqls.key);
  const foreignKeyConstraintSqls = foreignKeySqls.map((sqls) => sqls.constraint);
  const uniqueColumnArray = unique.map((columnName) => `\`${columnName}\``).join(',');

  // 2. define the lines of content of the table
  const contents = [
    ...columnSqls, // all of the columns (one per property)
    'PRIMARY KEY (`id`)', // primary key definition
    `UNIQUE KEY \`${tableName}_ux1\` (${uniqueColumnArray})`, // unique key defintion; required since it is required for idempotency
    ...foreignKeyKeySqls, // indexes defined for FKs
    ...foreignKeyConstraintSqls, // constraints defined for FKs
  ];

  // 2. generate the create table sql
  const sql = `
CREATE TABLE \`${tableName}\` (
  ${contents.join(',\n  ')}
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin
  `.trim();

  // 3. return the sql
  return sql;
};
