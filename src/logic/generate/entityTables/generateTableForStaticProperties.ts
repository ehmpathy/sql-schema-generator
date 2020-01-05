import { Properties, Property } from '../../../types';
import * as prop from '../../define/defineProperty';
import { castPropertyToColumnName } from '../utils/castPropertyToColumnName';
import { pickKeysFromObject } from '../utils/pickKeysFromObject';
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
  // 0. split singular and array properties
  const staticSingularProperties = pickKeysFromObject({
    object: properties,
    keep: (property: Property) => !property.array,
  });
  const staticArrayProperties = pickKeysFromObject({
    object: properties,
    keep: (property: Property) => !!property.array,
  });

  // 1. add metadata properties
  const staticProps = {
    id: prop.BIGINT(),
    uuid: prop.UUID(),
    created_at: new Property({
      ...prop.DATETIME(6),
      default: 'CURRENT_TIMESTAMP(6)',
    }),
    ...staticSingularProperties,
    ...castArrayPropertiesToValuesHashProperties({ properties: staticArrayProperties }),
  };

  // 2. generate the table
  const tableName = entityName;
  const uniqueColumnNames = unique.map((propertyName) =>
    castPropertyToColumnName({ name: propertyName, definition: properties[propertyName] }),
  );
  const tableSql = generateTable({ tableName, unique: uniqueColumnNames, properties: staticProps });

  // 3. return sql
  return {
    name: tableName,
    sql: tableSql,
  };
};
