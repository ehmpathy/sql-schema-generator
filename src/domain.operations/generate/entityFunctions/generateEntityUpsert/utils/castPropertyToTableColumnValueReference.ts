import type { Property } from '@src/domain.objects';
import { isNativeArrayProperty } from '@src/domain.operations/utils/isNativeArrayProperty';

import { castPropertyToInputVariableName } from './castPropertyToInputVariableName';

/*
  defines the input value reference for the main tables (static and version)
    - a native array is written to its real array column directly (its own value, no hash)
    - a join-table array is reduced to a sha256 hash column (the column on which change is detected)
    - a scalar is written directly

  note: the join-table hash reference is not used by the join tables themselves - they loop
  through the input array element by element, and can not use the hash value
*/
export const castPropertyToTableColumnValueReference = ({
  name,
  definition,
}: {
  name: string;
  definition: Property;
}) => {
  const inputVariableName = castPropertyToInputVariableName({ name });

  // a native array is written to a real array column directly - no hash
  if (isNativeArrayProperty({ property: definition })) return inputVariableName;

  // a join-table array hashes the input value into a binary value, for change detection
  if (definition.array)
    return `digest(array_to_string(${inputVariableName}, ',', '__NULL__'), 'sha256')`;

  // if not array, then return the input variable reference directly
  return inputVariableName;
};
