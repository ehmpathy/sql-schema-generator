import { Property } from '../../../../domain';
import { extractDataTypeDefinitionFromProperty } from '../../utils/extractDataTypeDefinitionFromProperty';

export const generateColumn = ({
  columnName,
  property,
}: {
  columnName: string;
  property: Property;
}) => {
  const modifiers = [
    columnName,

    extractDataTypeDefinitionFromProperty({ property }), // e.g., property => bigint(20)

    property.nullable ? 'NULL' : 'NOT NULL', // if not nullable, then NOT NULL

    property.default ? `DEFAULT ${property.default}` : '', // if default is set, use it; otherwise, no default
  ];
  return modifiers
    .filter((modifier) => !!modifier) // filter out null
    .join(' '); // merge into column
};
