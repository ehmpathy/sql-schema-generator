import { Property } from '../../../types';
export const extractMysqlTypeDefinitionFromProperty = ({ property }: { property: Property }) => {
  let typeModifier = '';
  if (property.type.precision) {
    typeModifier = `(${property.type.precision})`;
  }
  if (property.type.precision && property.type.scale) {
    typeModifier = `(${property.type.precision},${property.type.scale})`;
  }
  if (property.type.values) {
    typeModifier = `(${property.type.values.map((opt) => ["'", opt, "'"].join('')).join(',')})`;
  }
  return `${property.type.name}${typeModifier}`;
};
