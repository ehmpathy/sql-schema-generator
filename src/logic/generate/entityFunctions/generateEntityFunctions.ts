import { Entity } from '../../../types';
import { generateEntityBackfillCurrentVersionPointers } from './generateEntityBackfillCurrentVersionPointers';
import { generateEntityUpsert } from './generateEntityUpsert';
import { generateGetFromDelimiterSplitString } from './generateUtilFunctions/generateGetFromDelimiterSplitString';

export const generateEntityFunctions = ({ entity }: { entity: Entity }) => {
  // 1. determine info about the entity, to know which fn's are needed
  const isVersionedEntity = Object.values(entity.properties).some((property) => property.updatable);
  const hasMappingTables = Object.values(entity.properties).some((property) => property.array);

  // 2. define the sql
  const entityUpsert = generateEntityUpsert({ entity });
  const entityBackfillCurrentVersionPointers = isVersionedEntity
    ? generateEntityBackfillCurrentVersionPointers({ entity })
    : null;
  const utilFunctions = [];
  if (hasMappingTables) utilFunctions.push(generateGetFromDelimiterSplitString());

  // 3. return functions
  return {
    upsert: entityUpsert,
    backfillCurrentVersionPointers: entityBackfillCurrentVersionPointers,
    utils: utilFunctions,
  };
};
