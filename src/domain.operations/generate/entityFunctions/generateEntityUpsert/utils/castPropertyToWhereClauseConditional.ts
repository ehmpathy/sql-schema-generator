import type { Property } from '@src/domain.objects';
import { castPropertyToColumnName } from '@src/domain.operations/generate/utils/castPropertyToColumnName';
import { isNativeArrayProperty } from '@src/domain.operations/utils/isNativeArrayProperty';

import { castPropertyToTableColumnValueReference } from './castPropertyToTableColumnValueReference';

export const castPropertyToWhereClauseConditional = ({
  name,
  definition,
  tableAlias,
}: {
  name: string;
  definition: Property;
  tableAlias: string; // i.e., the namespace of the property
}) => {
  const columnName = castPropertyToColumnName({ name, definition });
  const namespacedColumnName = `${tableAlias}.${columnName}`;
  const columnValueReference = castPropertyToTableColumnValueReference({
    name,
    definition,
  });

  // a native array compares with `IS NOT DISTINCT FROM`, which is null-safe on both the whole
  // array and its elements. plain `=` returns NULL (not TRUE) when either side is NULL or the
  // array holds a NULL element (e.g. `{a,NULL} = {a,NULL}` is NULL), which would fail the match
  // and insert a spurious new version on every re-upsert of an unchanged array. this mirrors
  // the null-safety the join-table hash path already has via array_to_string(..., '__NULL__').
  if (isNativeArrayProperty({ property: definition }))
    return `AND (${namespacedColumnName} IS NOT DISTINCT FROM ${columnValueReference})`;

  return [
    `AND (${namespacedColumnName} = ${columnValueReference}`,
    definition.nullable
      ? ` OR (${namespacedColumnName} IS null AND ${columnValueReference} IS null)`
      : '', // NULL != NULL, so special check if field is nullable
    ')',
  ].join('');
};
