import type { Entity } from '@src/domain.objects';
import { isJoinTableArrayProperty } from '@src/domain.operations/utils/isJoinTableArrayProperty';

export const defineDeclarations = ({ entity }: { entity: Entity }) => {
  const declarations = [];

  // add the static table declaration
  declarations.push(
    'v_static_id bigint;',
    'v_created_at timestamptz := now(); -- define a common created_at timestamp to use',
  );

  // add the dynamic version table declarations, if needed
  const hasUpdatableProperties = Object.values(entity.properties).some(
    (property) => !!property.updatable,
  );
  if (hasUpdatableProperties) {
    declarations.push(
      'v_matching_version_id bigint;',
      'v_effective_at timestamptz := v_created_at; -- i.e., effective "now"',
      'v_current_version_id_recorded_in_pointer_table bigint;',
      'v_effective_at_of_current_version_recorded_in_pointer_table timestamptz;',
    );
  }

  // add the join-table loop declarations, if needed
  //   - only join-table arrays loop per element; native arrays are written as one value
  const hasJoinTableArrayProperties = Object.values(entity.properties).some(
    (property) => isJoinTableArrayProperty({ property }),
  );
  if (hasJoinTableArrayProperties) {
    declarations.push(
      'v_array_access_index int;', // tracks the index of the array that we're at
    );
  }

  // return the declarations
  return declarations;
};
