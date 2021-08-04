import indentString from 'indent-string';

import { Entity } from '../../../domain';

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
CREATE OR REPLACE FUNCTION backfill_${entity.name}_cvp(
  in_limit int
)
RETURNS int
LANGUAGE plpgsql
AS $$
  DECLARE
    v_cvp_rows_inserted int;
    v_cvp_rows_updated int;
    v_remaining_limit int;
  BEGIN
    -- 1. insert every time cvp dne for an entity
    INSERT INTO ${entity.name}_cvp
      (${entity.name}_id, ${entity.name}_version_id)
    SELECT
      e.id,
      e_to_cv.current_version_id
    FROM ${entity.name} e
    JOIN (
      ${indentString(selectCurrentVersionIdForEntity, 6).trim()}
    ) AS e_to_cv ON e_to_cv.id = e.id
    WHERE 1=1
      AND NOT EXISTS (
        SELECT 'x'
        FROM ${entity.name}_cvp cvp
        WHERE cvp.${entity.name}_id = e.id
      )
    LIMIT in_limit;
    GET DIAGNOSTICS v_cvp_rows_inserted = ROW_COUNT;
    v_remaining_limit := in_limit - v_cvp_rows_inserted;

    -- 2. update every time cvp exists but is out of sync for an entity
    WITH cvp_to_update AS (
      SELECT
        cvp.id,
        e_to_cv.current_version_id as actual_current_version_id
      FROM (
        ${indentString(selectCurrentVersionIdForEntity, 6).trim()}
      ) AS e_to_cv
      JOIN ${entity.name}_cvp cvp ON cvp.${entity.name}_id = e_to_cv.id
      WHERE cvp.${entity.name}_version_id <> e_to_cv.current_version_id
      LIMIT v_remaining_limit
    )
    UPDATE ${entity.name}_cvp
    SET
      updated_at = now(),
      ${entity.name}_version_id = cvp_to_update.actual_current_version_id
    FROM cvp_to_update
    WHERE ${entity.name}_cvp.id = cvp_to_update.id;
    GET DIAGNOSTICS v_cvp_rows_updated = ROW_COUNT;

    -- return the number of rows affected
    RETURN v_cvp_rows_inserted + v_cvp_rows_updated;
  END;
$$
  `.trim();
  return {
    name: `backfill_${entity.name}_cvp`,
    sql: definition,
  };
};
