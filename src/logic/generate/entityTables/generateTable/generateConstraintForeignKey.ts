import { Property } from '../../../../types';

/*
  // TODO: generalize w/ adapter pattern to other languages

  NOTE: in mysql generating a FK constraint automatically generates a 'key' on the referential column, so this util defines both of those to be explicit
*/
export const generateConstraintForeignKey = ({ index, tableName, columnName, property }: {
  index: number,
  tableName: string,
  columnName: string,
  property: Property,
}) => {
  const constraintName = `${tableName}_fk${index}`;
  const constraintSql = `
CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`${columnName}\`) REFERENCES \`${property.references!}\` (\`id\`)
  `.trim();
  const keySql = `
KEY \`${constraintName}\` (\`${columnName}\`)
  `.trim();

  return {
    key: keySql,
    constraint: constraintSql,
  };
};
