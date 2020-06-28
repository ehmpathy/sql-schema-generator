import { Property } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateTable } from './generateTable';

export const generateTableForCurrentVersionPointer = ({ entityName }: { entityName: string }) => {
  // 0. add metadata properties
  const staticTableReferenceName = `${entityName}_id`;
  const versionTableReferenceName = `${entityName}_version_id`;
  const currentVersionPointerProps = {
    id: prop.BIGSERIAL(),
    updated_at: new Property({
      ...prop.TIMESTAMPTZ(),
      default: 'now()',
    }),
    [staticTableReferenceName]: new Property({
      ...prop.BIGINT(),
      references: entityName,
    }),
    [versionTableReferenceName]: new Property({
      ...prop.BIGINT(),
      references: `${entityName}_version`,
    }),
  };

  // 1. generate the version table
  const tableName = `${entityName}_cvp`;
  const tableSql = generateTable({
    tableName,
    unique: [staticTableReferenceName],
    properties: currentVersionPointerProps,
  });

  // 2. return sql
  return {
    name: tableName,
    sql: tableSql,
  };
};
