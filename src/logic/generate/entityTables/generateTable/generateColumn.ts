import { DataTypeName, Property } from '../../../../types';

/*
  // TODO: generalize w/ adapter pattern to other languages
*/
const textTypes = [DataTypeName.CHAR, DataTypeName.VARCHAR, DataTypeName.TEXT, DataTypeName.ENUM];
export const generateColumn = ({ columnName, property }: { columnName: string, property: Property }) => {

  // define the type modifier
  let typeModifier = '';
  if (property.type.precision) typeModifier = `(${property.type.precision})`;
  if (property.type.values) typeModifier = `(${property.type.values.map(opt => "'" + opt + "'").join(',')})`; // tslint:disable-line prefer-template

  // define default over-rides
  let defaultNullRelation = (property.nullable) ? 'DEFAULT NULL' : ''; // if nullable, then the "default" default is "null"; else, nothing
  if (property.type.name === DataTypeName.TEXT) defaultNullRelation = ''; // if its varchar, then even if nullable don't show default as null; // TODO: discover why SHOW CREATE has this exception

  // define the full column definition
  const modifiers = [
    `\`${columnName}\``,

    `${property.type.name}${typeModifier}`, // empty string if precision not defined

    (textTypes.includes(property.type.name)) ? 'COLLATE utf8mb4_unicode_ci' : '', // coalate if its a string type;

    (property.nullable) ? '' : 'NOT NULL', // if not nullable, then NOT NULL

    (property.default) ? `DEFAULT ${property.default}` : defaultNullRelation, // if default is set, use it; otherwise, no default

    (property.comment) ? `COMMENT '${property.comment}'` : '', // empty string if comment not defined
  ];
  return modifiers
    .filter(modifier => !!modifier) // filter out null
    .join(' '); // merge into column
};
