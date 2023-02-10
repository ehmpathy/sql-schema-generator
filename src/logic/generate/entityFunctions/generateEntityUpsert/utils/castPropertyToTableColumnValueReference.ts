import { Property } from '../../../../../domain';
import { castPropertyToInputVariableName } from './castPropertyToInputVariableName';

/*
  defines the input value reference for the main tables (static and version)
    - purpose: abstract away the fact that we have to "hash" the input for array variables

  NOTE: this is not used by the mapping tables - as they have a special way of parsing the input variable value
    - i.e., they parse and loop through it
    - not to mention they can not use the hash value
*/
export const castPropertyToTableColumnValueReference = ({
  name,
  definition,
}: {
  name: string;
  definition: Property;
}) => {
  const inputVariableName = castPropertyToInputVariableName({ name });

  // if it is an array, then hash the input value into a binary value
  if (definition.array)
    return `digest(array_to_string(${inputVariableName}, ',', '__NULL__'), 'sha256')`;

  // if not array, then return the input variable reference directly
  return inputVariableName;
};
