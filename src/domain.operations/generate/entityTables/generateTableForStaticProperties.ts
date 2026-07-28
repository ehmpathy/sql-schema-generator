import { type Properties, Property } from '@src/domain.objects';
import * as prop from '@src/domain.operations/define/defineProperty';
import { castPropertyToColumnName } from '@src/domain.operations/generate/utils/castPropertyToColumnName';
import { pickKeysFromObject } from '@src/domain.operations/generate/utils/pickKeysFromObject';
import { isJoinTableArrayProperty } from '@src/domain.operations/utils/isJoinTableArrayProperty';

import { generateTable } from './generateTable';
import { castArrayPropertiesToValuesHashProperties } from './utils/castArrayPropertiesToValuesHashProperties';

export const generateTableForStaticProperties = ({
  entityName,
  properties,
  unique,
}: {
  entityName: string;
  properties: Properties;
  unique: string[];
}) => {
  // 0. split singular and join-table-array properties
  //    - native arrays flow through as real array columns, so they count as "singular" here
  //    - only join-table arrays are swapped for a values-hash column
  const staticSingularProperties = pickKeysFromObject({
    object: properties,
    keep: (property: Property) => !isJoinTableArrayProperty({ property }),
  });
  const staticArrayProperties = pickKeysFromObject({
    object: properties,
    keep: (property: Property) => isJoinTableArrayProperty({ property }),
  });

  // 1. add metadata properties
  const staticProps: Properties = {
    id: prop.BIGSERIAL(),
    uuid: prop.UUID(),
    created_at: new Property({
      ...prop.TIMESTAMPTZ(),
      default: 'now()',
    }),
    ...staticSingularProperties,
    ...castArrayPropertiesToValuesHashProperties({
      properties: staticArrayProperties,
    }),
  };

  // 2. generate the table
  const tableName = entityName;
  const uniqueColumnNames = unique.map((propertyName) =>
    propertyName === 'uuid'
      ? 'uuid' // uuid is special case as we can be unique on it without user specifying it explicitly - so, if its uuid, we know its not going to need a name change
      : castPropertyToColumnName({
          name: propertyName,
          definition: properties[propertyName]!,
        }),
  );
  const tableSql = generateTable({
    tableName,
    unique: uniqueColumnNames,
    properties: staticProps,
  });

  // 3. return sql
  return {
    name: tableName,
    sql: tableSql,
  };
};
