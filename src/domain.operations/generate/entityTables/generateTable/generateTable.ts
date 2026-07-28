import type { Property } from '@src/domain.objects';
import { castCheckToArrayElementMembership } from '@src/domain.operations/utils/castCheckToArrayElementMembership';
import { isNativeArrayProperty } from '@src/domain.operations/utils/isNativeArrayProperty';

import { defineConstraintNameSafely } from './defineConstraintNameSafely';
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
    throw new Error(
      'must have atleast one unique property; otherwise, idempotency cant be enforced',
    );
  }

  // define sql per column
  const columnSqls = Object.entries(properties).map((entry) =>
    generateColumn({ columnName: entry[0], property: entry[1] }),
  );

  // define primary key
  const primaryKeySql = `CONSTRAINT ${defineConstraintNameSafely({
    tableName,
    constraintName: 'pk',
  })} PRIMARY KEY (id)`;

  // define unique index
  const uniqueConstraintSql = `CONSTRAINT ${defineConstraintNameSafely({
    tableName,
    constraintName: 'ux1',
  })} UNIQUE (${unique.join(', ')})`; // unique key definition; required since it is required for idempotency

  // define foreign keys
  const foreignKeySqls = Object.entries(properties)
    .filter((entry) => !!entry[1].references)
    .map((entry, index) =>
      generateConstraintForeignKey({
        index,
        columnName: entry[0],
        tableName,
        property: entry[1],
      }),
    );
  const foreignKeyIndexSqls = foreignKeySqls.map((sqls) => sqls.index);
  const foreignKeyConstraintSqls = foreignKeySqls.map(
    (sqls) => sqls.constraint,
  );

  // define check constraints
  //   - a native array column can only carry an element-membership check; the authoritative
  //     guard runs here (at emission) so a scalar check spread onto an array property after
  //     ARRAY_OF (e.g. `{ ...ARRAY_OF(x), check }`) is caught regardless of construction order.
  //     castCheckToArrayElementMembership is idempotent, so an already-recast `<@` check passes
  //     through and a scalar/custom check fails fast at generate time, not apply time.
  const checkConstraintSqls = Object.entries(properties)
    .filter((entry) => !!entry[1].check)
    .map((entry) => {
      const check = isNativeArrayProperty({ property: entry[1] })
        ? castCheckToArrayElementMembership({ check: entry[1].check! })
        : entry[1].check!;
      return `CONSTRAINT ${defineConstraintNameSafely({
        tableName,
        constraintName: `${entry[0]}_check`,
      })} CHECK ${check.replace(/\$COLUMN_NAME/g, entry[0])}`;
    })
    .sort();

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
