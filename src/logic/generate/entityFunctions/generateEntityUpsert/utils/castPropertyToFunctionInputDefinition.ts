import { Property } from '../../../../../domain';
import { extractDataTypeDefinitionFromProperty } from '../../../utils/extractDataTypeDefinitionFromProperty';
import { castPropertyToInputVariableName } from './castPropertyToInputVariableName';

/*
  NOTE: special logic added here to treat array properties.
    For array properties, the input type is different from that defined on the property - due to being an "array" of those properties
*/

export const castPropertyToFunctionInputDefinition = ({ name, definition }: { name: string; definition: Property }) => {
  const inputVariableName = castPropertyToInputVariableName({ name });
  const inputVariableType = extractDataTypeDefinitionFromProperty({ property: definition });
  return `${inputVariableName} ${inputVariableType}`;
};
