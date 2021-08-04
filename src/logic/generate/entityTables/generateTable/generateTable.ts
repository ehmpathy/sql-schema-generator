import { Property } from '../../../../domain';
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
    throw new Error('must have atleast one unique property; otherwise, idempotency cant be enforced');
  }

  // define sql per column
  const columnSqls = Object.entries(properties).map((entry) =>
    generateColumn({ columnName: entry[0], property: entry[1] }),
  );

  // define primary key
  const primaryKeySql = `CONSTRAINT ${tableName}_pk PRIMARY KEY (id)`;

  // define unique index
  const uniqueConstraintSql = `CONSTRAINT ${tableName}_ux1 UNIQUE (${unique.join(', ')})`; // unique key definition; required since it is required for idempotency

  // define foreign keys
  const foreignKeySqls = Object.entries(properties)
    .filter((entry) => !!entry[1].references)
    .map((entry, index) =>
      generateConstraintForeignKey({ index, columnName: entry[0], tableName, property: entry[1] }),
    );
  const foreignKeyIndexSqls = foreignKeySqls.map((sqls) => sqls.index);
  const foreignKeyConstraintSqls = foreignKeySqls.map((sqls) => sqls.constraint);

  // define check constraints
  const checkConstraintSqls = Object.entries(properties)
    .filter((entry) => !!entry[1].check)
    .map((entry) => {
      return `CONSTRAINT ${tableName}_${entry[0]}_check CHECK ${entry[1].check!.replace(/\$COLUMN_NAME/g, entry[0])}`;
    });

  // 2. define the lines of content of the table
  const contents = [
    ...columnSqls, // all of the columns (one per property)
    primaryKeySql,
    uniqueConstraintSql,
    ...foreignKeyConstraintSqls, // constraints defined for FKs
    ...checkConstraintSqls, // constraints defined for checks
  ];

  // define the indexes we're creating
  const indexes = [
    // NOTE: pk index is auto created
    // NOTE: ux index is auto created
    ...foreignKeyIndexSqls, // indexes defined for FKs
  ];

  // 2. generate the create table sql
  const sql = `
CREATE TABLE ${tableName} (
  ${contents.join(',\n  ')}
);
${indexes.join('\n')}
  `.trim();

  // 3. return the sql
  return sql;
};
