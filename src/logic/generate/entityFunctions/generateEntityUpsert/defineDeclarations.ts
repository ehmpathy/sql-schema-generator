import { Entity } from '../../../../types';

export const defineDeclarations = ({ entity }: { entity: Entity }) => {
  const declarations = [];

  // add the static table declaration
  declarations.push(
    'DECLARE v_static_id BIGINT;',
    'DECLARE v_created_at DATETIME(6) DEFAULT CURRENT_TIMESTAMP(6); -- define a common created_at timestamp to use',
  );

  // add the dynamic version table declarations, if needed
  const hasUpdatableProperties = Object.values(entity.properties).some((property) => !!property.updatable);
  if (hasUpdatableProperties) {
    declarations.push(
      'DECLARE v_matching_version_id BIGINT;',
      'DECLARE v_effective_at DATETIME(6) DEFAULT v_created_at; -- define the effective_at to equal created_at by default (i.e., effective _now_)',
      'DECLARE v_current_version_id_recorded_in_pointer_table BIGINT;',
      'DECLARE v_effective_at_of_current_version_recorded_in_pointer_table DATETIME(6);',
    );
  }

  // add the mapping table loop declarations, if needed
  const hasArrayProperties = Object.values(entity.properties).some((property) => !!property.array);
  if (hasArrayProperties) {
    declarations.push(
      'DECLARE v_delimited_string_access_index INT;',
      'DECLARE v_delimited_string_access_value VARCHAR(255);',
      'DECLARE v_can_still_find_values_in_delimited_string BOOLEAN;',
    );
  }

  // return the declarations
  return declarations;
};
