import { Property } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateTable } from './generateTable';

export const generateTableForUpdateableProperties = ({ entityName, properties }: {
  entityName: string,
  properties: { [index: string]: Property },
}) => {
  // 0. add metadata properties
  const staticTableReferenceName = `${entityName}_id`;
  const updateableProps = {
    id: prop.BIGINT(),
    [staticTableReferenceName]: new Property({
      ...prop.BIGINT(),
      references: entityName,
    }),
    effective_at: new Property({
      ...prop.DATETIME(6),
      default: 'CURRENT_TIMESTAMP(6)',
    }),
    created_at: new Property({
      ...prop.DATETIME(6),
      default: 'CURRENT_TIMESTAMP(6)',
    }),
    ...properties,
  };

  // 1. generate the version table
  const tableName = `${entityName}_version`;
  const tableSql = generateTable({
    tableName,
    unique: [staticTableReferenceName, 'effective_at', 'created_at'],
    properties: updateableProps,
  });

  // 2. return sql
  return {
    name: tableName,
    sql: tableSql,
  };
};
