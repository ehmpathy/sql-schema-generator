import { Entity } from '../../../../types';
import { generateEntityTables } from '../../../generate/entityTables/generateEntityTables';
import { generateEntityUpsert } from '../../../generate/entityUpsert/generateEntityUpsert';
import { generateEntityCurrentView } from '../../../generate/entityViews/generateEntityCurrentView';
import { mkdir, writeFile } from './_utils/fileIO';

/*
  1. generate
    - generate tables
    - generate upsert
    - generate views

  2. record
    - output each to targetDirPath
*/
enum ResourceType {
  TABLE = 'TABLE',
  FUNCTION = 'FUNCTION',
  VIEW = 'VIEW',
}
const resourceSpecificDir = {
  [ResourceType.TABLE]: 'tables',
  [ResourceType.FUNCTION]: 'functions',
  [ResourceType.VIEW]: 'views',
};
const saveResource = async ({ sql, name, type, targetDirPath }: {
  sql: string,
  name: string,
  type: ResourceType,
  targetDirPath: string,
}) => {
  // ensure directory is defined
  const dir = `${targetDirPath}/${resourceSpecificDir[type]}`;
  await mkdir(dir).catch((error) => { if (error.code !== 'EEXIST') throw error; }); // mkdir and ignore if dir already exists

  // write the resource sql to that dir
  const filePath = `${dir}/${name}.sql`;
  await writeFile(filePath, sql);
};

export const generateAndRecordEntitySchema = async ({ entity, targetDirPath }: { entity: Entity, targetDirPath: string }) => {
  // 1. generate all resource sql
  const tables = await generateEntityTables({ entity });
  const upsert = await generateEntityUpsert({ entity });
  const views = { current: await generateEntityCurrentView({ entity }) }; // TODO: views = the returned object when we add the hydrated view

  // 2. save each resource
  await saveResource({ sql: tables.static.sql, name: tables.static.name, type: ResourceType.TABLE, targetDirPath });
  if (tables.version) await saveResource({ sql: tables.version.sql, name: tables.version.name, type: ResourceType.TABLE, targetDirPath });
  await await saveResource({ sql: upsert.sql, name: upsert.name, type: ResourceType.FUNCTION, targetDirPath });
  if (views.current) await saveResource({ sql: views.current.sql, name: views.current.name, type: ResourceType.VIEW, targetDirPath });
};
