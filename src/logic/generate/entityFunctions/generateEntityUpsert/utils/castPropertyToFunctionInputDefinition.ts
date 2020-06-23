import { Property } from '../../../../../types';
import { prop } from '../../../../define';
import { extractMysqlTypeDefinitionFromProperty } from '../../../utils/extractDataTypeDefinitionFromProperty';
import { castPropertyToInputVariableName } from './castPropertyToInputVariableName';

/*
  NOTE: special logic added here to treat array properties.
    For array properties, the input type is different from that defined on the property - due to being an "array" of those properties
*/

export const castPropertyToFunctionInputDefinition = ({ name, definition }: { name: string; definition: Property }) => {
  const inputVariableName = castPropertyToInputVariableName({ name });
  const inputVariableType = definition.array
    ? extractMysqlTypeDefinitionFromProperty({ property: prop.VARCHAR(16383) }) // if its an array, the input will be a comma separated string, e.g., '1,10,232,3,51'; 16383 is max for input
    : extractMysqlTypeDefinitionFromProperty({ property: definition }); // otherwise, the value will be what the user defined the property as
  return `${inputVariableName} ${inputVariableType}`;
};
