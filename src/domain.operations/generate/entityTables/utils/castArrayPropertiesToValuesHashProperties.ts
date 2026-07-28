import type { Property } from '@src/domain.objects';
import { prop } from '@src/domain.operations/define';
import { castPropertyToColumnName } from '@src/domain.operations/generate/utils/castPropertyToColumnName';
import { isJoinTableArrayProperty } from '@src/domain.operations/utils/isJoinTableArrayProperty';

/*
  we store the hash of the array values on the tables themselves, for performance and simplicity in comparison queries
    even though the data is mastered through mapping tables

  this gives us a utility to "create a values hash property for each array property"

  note: only join-table arrays get a values-hash column. a native array is a real column and must
  never be swapped for a hash, so we assert the tight precondition (isJoinTableArrayProperty) rather
  than the looser `.array`, to fail loud if a future caller forgets to pre-filter.
*/
export const castArrayPropertiesToValuesHashProperties = ({
  properties,
}: {
  properties: { [index: string]: Property };
}) => {
  const castedProperties: { [index: string]: Property } = {};
  Object.entries(properties).forEach(([name, definition]) => {
    if (!isJoinTableArrayProperty({ property: definition })) {
      throw new Error(
        'error - a non-join-table-array property was asked to have been casted into a values hash property',
      );
    }
    const columnName = castPropertyToColumnName({ name, definition });
    castedProperties[columnName] = prop.BYTEA();
  });
  return castedProperties;
};
