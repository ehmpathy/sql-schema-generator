import { Property } from '../../../types';
import * as prop from '../../define/defineProperty';
import { generateTable } from './generateTable';

export const generateTableForStaticProperties = ({
  entityName,
  properties,
  unique,
}: {
  entityName: string;
  properties: { [index: string]: Property };
  unique: string[];
}) => {
  // 0. add metadata properties
  const staticProps = {
    id: prop.BIGINT(),
    uuid: prop.UUID(),
    created_at: new Property({
      ...prop.DATETIME(6),
      default: 'CURRENT_TIMESTAMP(6)',
    }),
    ...properties,
  };

  // 1. generate the table
  const tableName = entityName;
  const tableSql = generateTable({ tableName, unique, properties: staticProps });

  // 2. return sql
  return {
    name: tableName,
    sql: tableSql,
  };
};
