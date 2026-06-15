import type { Property } from '@src/domain.objects';
import { prop } from '@src/domain.operations/define';
import { castPropertyToColumnName } from '@src/domain.operations/generate/utils/castPropertyToColumnName';

/*
  we store the hash of the array values on the tables themselves, for performance and simplicity in comparison queries
    even though the data is mastered through mapping tables

  this gives us a utility to "create a values hash property for each array property"
*/
export const castArrayPropertiesToValuesHashProperties = ({
  properties,
}: {
  properties: { [index: string]: Property };
}) => {
  const castedProperties: { [index: string]: Property } = {};
  Object.entries(properties).forEach(([name, definition]) => {
    if (!definition.array) {
      throw new Error(
        'error - non array property was asked to have been casted into values hash property',
      );
    }
    const columnName = castPropertyToColumnName({ name, definition });
    castedProperties[columnName] = prop.BYTEA();
  });
  return castedProperties;
};
