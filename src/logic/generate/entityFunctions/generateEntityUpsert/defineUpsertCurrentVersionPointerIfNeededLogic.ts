import { Entity } from '../../../../types';

export const defineUpsertCurrentVersionPointerIfNeededLogic = ({ entity }: { entity: Entity }) => {
  // define the updatable property names
  const updatablePropertyNames = Object.entries(entity.properties)
    .filter((entry) => !!entry[1].updatable)
    .map((entry) => entry[0]);

  // if no updatable properties - nothing to do here! its not a versioned entity
  if (updatablePropertyNames.length === 0) return null;

  // define the logic, since we have updatable properties -> a version to track
  return `
  -- update the current version pointer table, if it is not already up to date
  SET v_current_version_id_recorded_in_pointer_table = ( -- get the version recorded as current for the entity, if any
    SELECT ${entity.name}_version_id
    FROM ${entity.name}_cvp
    WHERE 1=1
      AND ${entity.name}_id = v_static_id -- for this entity
  );
  IF (v_current_version_id_recorded_in_pointer_table IS null) THEN -- if its null, then just insert it, since it isn't already defined
    INSERT INTO ${entity.name}_cvp
      (updated_at, ${entity.name}_id, ${entity.name}_version_id)
      VALUES
      (v_created_at, v_static_id, v_matching_version_id);
    SET v_current_version_id_recorded_in_pointer_table = v_matching_version_id; -- and record that the current version recorded is now the real current version
  END IF;
  IF (v_current_version_id_recorded_in_pointer_table <> v_matching_version_id) THEN -- if they are not exactly equal, try to update the current version recorded in the pointer table
    SET v_effective_at_of_current_version_recorded_in_pointer_table = ( -- grab the effective_at value of the recorded current version
      SELECT effective_at
      FROM ${entity.name}_version
      WHERE id = v_current_version_id_recorded_in_pointer_table
    );
    IF (v_effective_at_of_current_version_recorded_in_pointer_table < v_effective_at) THEN -- update cached current version only if the version we just inserted is "newer" than the currently cached version
      UPDATE ${entity.name}_cvp
      SET
        ${entity.name}_version_id = v_matching_version_id,
        updated_at = v_created_at
      WHERE
      ${entity.name}_id = v_static_id;
    END IF;
  END IF;
`.trim();
};
