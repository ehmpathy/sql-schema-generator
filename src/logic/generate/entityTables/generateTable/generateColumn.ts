import { DataTypeName, Property } from '../../../../types';
import { extractMysqlTypeDefinitionFromProperty } from '../../utils/extractMysqlTypeDefinitionFromProperty';

/*
  // TODO: generalize w/ adapter pattern to other languages
*/
const textTypes = [
  DataTypeName.CHAR,
  DataTypeName.VARCHAR,
  DataTypeName.TINYTEXT,
  DataTypeName.TEXT,
  DataTypeName.MEDIUMTEXT,
  DataTypeName.LONGTEXT,
  DataTypeName.ENUM,
];
export const generateColumn = ({ columnName, property }: { columnName: string, property: Property }) => {

  // define default over-rides
  let defaultNullRelation = (property.nullable) ? 'DEFAULT NULL' : ''; // if nullable, then the "default" default is "null"; else, nothing
  if (property.type.name === DataTypeName.TEXT) defaultNullRelation = ''; // if its varchar, then even if nullable don't show default as null; // TODO: discover why SHOW CREATE has this exception

  // define the full column definition
  const modifiers = [
    `\`${columnName}\``,

    extractMysqlTypeDefinitionFromProperty({ property }), // e.g., property => bigint(20)

    (textTypes.includes(property.type.name)) ? 'COLLATE utf8_bin' : '', // coalate if its a string type; collate to Case Sensitive by default

    (property.nullable) ? '' : 'NOT NULL', // if not nullable, then NOT NULL

    (property.default) ? `DEFAULT ${property.default}` : defaultNullRelation, // if default is set, use it; otherwise, no default

    (property.comment) ? `COMMENT '${property.comment}'` : '', // empty string if comment not defined

    (columnName === 'id') ? 'AUTO_INCREMENT' : '',
  ];
  return modifiers
    .filter(modifier => !!modifier) // filter out null
    .join(' '); // merge into column
};
