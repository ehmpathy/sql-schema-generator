import { Property } from '../../../../../types';
import { castPropertyToColumnName } from '../../../utils/castPropertyToColumnName';
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
  const columnValueReference = castPropertyToTableColumnValueReference({ name, definition });
  return [
    `AND (${namespacedColumnName} = ${columnValueReference}`,
    definition.nullable ? ` OR (${namespacedColumnName} IS null AND ${columnValueReference} IS null)` : '', // NULL != NULL, so special check if field is nullable
    ')',
  ].join('');
};
