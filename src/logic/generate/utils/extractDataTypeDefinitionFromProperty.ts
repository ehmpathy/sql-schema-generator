import { Property } from '../../../domain';

// https://www.postgresql.org/docs/10/datatype.html
export const extractDataTypeDefinitionFromProperty = ({
  property,
}: {
  property: Property;
}) => {
  let typeModifier = '';
  if (property.type.precision) {
    typeModifier = `(${property.type.precision})`;
  }
  if (property.type.precision && property.type.scale) {
    typeModifier = `(${property.type.precision}, ${property.type.scale})`;
  }
  if (property.array) {
    typeModifier += '[]';
  }
  return `${property.type.name}${typeModifier}`;
};
