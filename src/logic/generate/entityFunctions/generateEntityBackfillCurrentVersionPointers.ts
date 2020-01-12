import indentString from 'indent-string';

import { Entity } from '../../../types';

/*
1. define procedure / function (try function if possible)
2. logic
  1. insert the entities that don't have a CVP
  2. update the entities that do have a CVP but are out of sync

note: insert on conflict update was not used because there would be no efficient way to determine number of rows affected
  - since "on conflict update" shows as "two" rows affected... https://stackoverflow.com/questions/3747314/why-are-2-rows-affected-in-my-insert-on-duplicate-key-update
*/

export const generateEntityBackfillCurrentVersionPointers = ({ entity }: { entity: Entity }) => {
  // define select statement for getting current version for entity
  const selectCurrentVersionIdForEntity = `
SELECT
  e.id as id,
  v.id as current_version_id
FROM ${entity.name} e
JOIN ${entity.name}_version v ON v.${entity.name}_id = e.id
WHERE 1=1
  AND effective_at = ( -- and is the currently effective version
    SELECT MAX(effective_at)
    FROM ${entity.name}_version ssv
    WHERE ssv.${entity.name}_id = e.id -- for same entity
  )
  `.trim();

  // combine the version and static logic into full upsert function
  const definition = `
CREATE FUNCTION \`backfill_${entity.name}_cvp\`(in_limit INT) RETURNS int(20)
BEGIN
  -- declarations
  DECLARE v_cvp_rows_inserted INT;
  DECLARE v_cvp_rows_updated INT;
  DECLARE v_remaining_limit INT;

  -- 1. insert every time cvp dne for an entity
  INSERT INTO ${entity.name}_cvp
    (${entity.name}_id, ${entity.name}_version_id)
  SELECT
    e.id,
    e_to_cv.current_version_id
  FROM ${entity.name} e
  JOIN (
    ${indentString(selectCurrentVersionIdForEntity, 4).trim()}
  ) AS e_to_cv ON e_to_cv.id = e.id
  WHERE 1=1
    AND NOT EXISTS (
      SELECT 'x'
      FROM ${entity.name}_cvp cvp
      WHERE cvp.${entity.name}_id = e.id
    )
  LIMIT in_limit;
  SET v_cvp_rows_inserted = ROW_COUNT();
  SET v_remaining_limit = in_limit - v_cvp_rows_inserted;

  -- 2. update every time cvp exists but is out of sync for an entity
  UPDATE ${entity.name}_cvp cvp
  JOIN (
    ${indentString(selectCurrentVersionIdForEntity, 4).trim()}
  ) AS e_to_cv ON e_to_cv.id = cvp.${entity.name}_id
  SET
    updated_at = CURRENT_TIMESTAMP(6),
    cvp.${entity.name}_version_id = e_to_cv.current_version_id -- set pointer table to have current version
  WHERE cvp.${entity.name}_id IN (
    SELECT id FROM ( -- ugly? agreed: https://stackoverflow.com/a/12620023/3068233 - its the best way found so far to limit in an update
      SELECT
        cvp.${entity.name}_id as id
      FROM ${entity.name}_cvp cvp
      JOIN (
        ${indentString(selectCurrentVersionIdForEntity, 8).trim()}
      ) AS e_to_cv ON e_to_cv.id = cvp.${entity.name}_id
      WHERE 1=1
        AND cvp.${
          entity.name
        }_version_id <> e_to_cv.current_version_id -- where the pointer table does not already have current version
      LIMIT v_remaining_limit
    ) as tmp
  );
  SET v_cvp_rows_updated = ROW_COUNT();

  -- return the number of rows affected
  RETURN v_cvp_rows_inserted + v_cvp_rows_updated;
END
  `.trim();
  return {
    name: `backfill_${entity.name}_cvp`,
    sql: definition,
  };
};
