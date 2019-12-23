import { Entity } from '../../../types';
import { generateEntityBackfillCurrentVersionPointers } from './generateEntityBackfillCurrentVersionPointers';
import { generateEntityUpsert } from './generateEntityUpsert';

export const generateEntityFunctions = ({ entity }: { entity: Entity }) => {
  // 1. separate static -vs- updatable properties
  const isVersionedEntity = Object.values(entity.properties).some((property) => property.updatable);

  // 2. define the sql
  const entityUpsert = generateEntityUpsert({ entity });
  const entityBackfillCurrentVersionPointers = isVersionedEntity
    ? generateEntityBackfillCurrentVersionPointers({ entity })
    : null;

  // 3. return functions
  return {
    upsert: entityUpsert,
    backfillCurrentVersionPointers: entityBackfillCurrentVersionPointers,
  };
};
