import { toHashShake256Sync } from '../../../../__nonpublished_modules__/hash-fns/toHashShake256Sync';

const POSTGRES_RESOURCE_NAME_LEN_LIMIT = 63;

/**
 * .what = determines an intuitive yet safe constraint name
 * .why = postgres has a 63 char resource name limit
 * .how = include a hash if the ideal name would be too long
 */
export const defineConstraintNameSafely = (input: {
  tableName: string;
  constraintName: string;
}): string => {
  const idealConstraintName = [input.tableName, input.constraintName].join('_');
  if (idealConstraintName.length <= POSTGRES_RESOURCE_NAME_LEN_LIMIT)
    return idealConstraintName;
  const hash = toHashShake256Sync(input.tableName, 4);
  const tableNameLimit =
    POSTGRES_RESOURCE_NAME_LEN_LIMIT -
    hash.length -
    input.constraintName.length -
    2;
  const safeConstraintName = [
    input.tableName.slice(0, tableNameLimit),
    hash,
    input.constraintName,
  ].join('_');
  return safeConstraintName;
};
