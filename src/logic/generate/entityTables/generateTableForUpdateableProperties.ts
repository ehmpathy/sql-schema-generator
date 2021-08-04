import { Property } from '../../../domain';
import * as prop from '../../define/defineProperty';
import { pickKeysFromObject } from '../utils/pickKeysFromObject';
import { generateTable } from './generateTable';
import { castArrayPropertiesToValuesHashProperties } from './utils/castArrayPropertiesToValuesHashProperties';

export const generateTableForUpdateableProperties = ({
  entityName,
  properties,
}: {
  entityName: string;
  properties: { [index: string]: Property };
}) => {
  // 0. split singular and array properties
  const updatableSingularProperties = pickKeysFromObject({
    object: properties,
    keep: (property: Property) => !property.array,
  });
  const updatableArrayProperties = pickKeysFromObject({
    object: properties,
    keep: (property: Property) => !!property.array,
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
    ...castArrayPropertiesToValuesHashProperties({ properties: updatableArrayProperties }),
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
