import { Property } from '../../../../types';
import { extractDataTypeDefinitionFromProperty } from '../../utils/extractDataTypeDefinitionFromProperty';

export const generateColumn = ({ columnName, property }: { columnName: string; property: Property }) => {
  const modifiers = [
    columnName,

    extractDataTypeDefinitionFromProperty({ property }), // e.g., property => bigint(20)

    property.default ? `DEFAULT ${property.default}` : '', // if default is set, use it; otherwise, no default

    property.nullable ? 'NULL' : 'NOT NULL', // if not nullable, then NOT NULL
  ];
  return modifiers
    .filter((modifier) => !!modifier) // filter out null
    .join(' '); // merge into column
};
