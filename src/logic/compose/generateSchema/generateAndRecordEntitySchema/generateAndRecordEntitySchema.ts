import { Entity } from '../../../../domain';
import { generateEntityFunctions } from '../../../generate/entityFunctions/generateEntityFunctions';
import { generateEntityTables } from '../../../generate/entityTables/generateEntityTables';
import { generateEntityCurrentView } from '../../../generate/entityViews/generateEntityCurrentView';
import { mkdir, writeFile } from './utils/fileIO';

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
interface SqlResource {
  // TODO: define this as a SchematicModel in the "types/objects" dir and add the "type" as a property on it directly
  name: string;
  sql: string;
}

const resourceSpecificDir = {
  [ResourceType.TABLE]: 'tables',
  [ResourceType.FUNCTION]: 'functions',
  [ResourceType.VIEW]: 'views',
};
const saveResource = async ({
  sql,
  name,
  type,
  targetDirPath,
}: {
  sql: string;
  name: string;
  type: ResourceType;
  targetDirPath: string;
}) => {
  // ensure directory is defined
  const dir = `${targetDirPath}/${resourceSpecificDir[type]}`;
  await mkdir(dir, { recursive: true }).catch((error) => {
    if (error.code !== 'EEXIST') throw error;
  }); // mkdir and ignore if dir already exists

  // write the resource sql to that dir
  const filePath = `${dir}/${name}.sql`;
  await writeFile(filePath, sql);
};

export const generateAndRecordEntitySchema = async ({
  entity,
  targetDirPath,
}: {
  entity: Entity;
  targetDirPath: string;
}) => {
  // 1. generate all resource sql
  const tables = await generateEntityTables({ entity });
  const functions = await generateEntityFunctions({ entity });
  const views = { current: await generateEntityCurrentView({ entity }) };

  // 2. save the tables
  const tablesToSaveAsResources = [
    tables.static,
    tables.version,
    tables.currentVersionPointer,
    ...tables.mappings,
  ].filter((table) => !!table) as SqlResource[]; // filter the non defined ones out
  await Promise.all(
    tablesToSaveAsResources.map(async (sqlTable) => {
      await saveResource({
        sql: sqlTable.sql,
        name: sqlTable.name,
        type: ResourceType.TABLE,
        targetDirPath,
      });
    }),
  );

  // 3. save the functions
  const functionsToSaveAsResources = [
    functions.upsert,
    functions.backfillCurrentVersionPointers,
    ...functions.utils,
  ].filter((table) => !!table) as SqlResource[]; // filter the non defined ones out
  await Promise.all(
    functionsToSaveAsResources.map(async (sqlFunction) => {
      await saveResource({
        sql: sqlFunction.sql,
        name: sqlFunction.name,
        type: ResourceType.FUNCTION,
        targetDirPath,
      });
    }),
  );

  // 4. save the views
  if (views.current) {
    await saveResource({
      sql: views.current.sql,
      name: views.current.name,
      type: ResourceType.VIEW,
      targetDirPath,
    });
  }
};
