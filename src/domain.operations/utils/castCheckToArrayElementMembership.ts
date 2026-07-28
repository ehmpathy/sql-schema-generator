import { UserInputError } from '@src/utils/errors/UserInputError';

/**
 * recasts a scalar enum check into an element-membership check for a native array column.
 *
 * the solo ENUM path emits `($COLUMN_NAME IN ('A', 'B'))`, a scalar test that cannot apply
 * to an array column. for a native `<enum>[]` column, each element must be in the allowed
 * set, expressed as `($COLUMN_NAME <@ ARRAY['A', 'B']::varchar[])` (the column is contained
 * by the allowed set). the `$COLUMN_NAME` placeholder is substituted at DDL output time.
 *
 * this is idempotent: a check already in the `<@` element-membership form is returned
 * unchanged, so it is safe to apply both at declare time (early feedback) and again at
 * DDL emission (the authoritative guard) without a double transform.
 *
 * note:
 * - a NULL array passes the CHECK (postgres treats a NULL/unknown CHECK result as satisfied),
 *   consistent with the nullable-column contract.
 * - an empty array `{}` is contained by any set, so it passes.
 * - a check that does not fit the enum `IN (...)` shape is rejected (fail-fast): a scalar or
 *   custom check left on an array column would be operator-invalid DDL and fail only at apply
 *   time with a cryptic postgres error. only the ENUM path is supported for arrays.
 */
export const castCheckToArrayElementMembership = ({
  check,
}: {
  check: string;
}): string => {
  // already in element-membership form (recast earlier) -> idempotent passthrough
  if (/\$COLUMN_NAME <@ ARRAY\[/.test(check)) return check;

  // the enum scalar `IN (...)` form -> recast to element-membership
  const enumInPattern = /\$COLUMN_NAME IN \(([^)]*)\)/;
  const found = enumInPattern.exec(check);
  if (!found)
    throw new UserInputError({
      reason:
        'a native array column only supports the ENUM check shape; a custom or scalar check cannot be applied to a native array column',
      potentialSolution: [
        '',
        '- a scalar check (e.g. a regex or inequality) is operator-invalid against an array column and would fail only at apply time.',
        '- drop the custom check, or express the constraint via prop.ENUM([...]) for element-membership.',
      ].join('\n'),
    });
  const valuesList = found[1];
  return check.replace(
    enumInPattern,
    `$COLUMN_NAME <@ ARRAY[${valuesList}]::varchar[]`,
  );
};
