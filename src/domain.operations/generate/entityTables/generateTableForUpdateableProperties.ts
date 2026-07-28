import { Property } from '@src/domain.objects';
import * as prop from '@src/domain.operations/define/defineProperty';
import { pickKeysFromObject } from '@src/domain.operations/generate/utils/pickKeysFromObject';
import { isJoinTableArrayProperty } from '@src/domain.operations/utils/isJoinTableArrayProperty';

import { generateTable } from './generateTable';
import { castArrayPropertiesToValuesHashProperties } from './utils/castArrayPropertiesToValuesHashProperties';

export const generateTableForUpdateableProperties = ({
  entityName,
  properties,
}: {
  entityName: string;
  properties: { [index: string]: Property };
}) => {
  // 0. split singular and join-table-array properties
  //    - native arrays flow through as real array columns, so they count as "singular" here
  //    - only join-table arrays are swapped for a values-hash column
  const updatableSingularProperties = pickKeysFromObject({
    object: properties,
    keep: (property: Property) => !isJoinTableArrayProperty({ property }),
  });
  const updatableArrayProperties = pickKeysFromObject({
    object: properties,
    keep: (property: Property) => isJoinTableArrayProperty({ property }),
  });

  // 1. add metadata properties
  const staticTableReferenceName = `${entityName}_id`;
  const updateableProps = {
    id: prop.BIGSERIAL(),
    [staticTableReferenceName]: new Property({
      ...prop.BIGINT(),
      references: entityName,
    }),
    effective_at: new Property({
      ...prop.TIMESTAMPTZ(),
      default: 'now()',
    }),
    created_at: new Property({
      ...prop.TIMESTAMPTZ(),
      default: 'now()',
    }),
    ...updatableSingularProperties,
    ...castArrayPropertiesToValuesHashProperties({
      properties: updatableArrayProperties,
    }),
  };

  // 2. generate the version table
  const tableName = `${entityName}_version`;
  const tableSql = generateTable({
    tableName,
    unique: [staticTableReferenceName, 'effective_at', 'created_at'],
    properties: updateableProps,
  });

  // 3. return sql
  return {
    name: tableName,
    sql: tableSql,
  };
};
