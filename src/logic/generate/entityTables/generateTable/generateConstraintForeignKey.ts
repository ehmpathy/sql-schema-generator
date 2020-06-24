import { Property } from '../../../../types';

export const generateConstraintForeignKey = ({
  index,
  tableName,
  columnName,
  property,
}: {
  index: number;
  tableName: string;
  columnName: string;
  property: Property;
}) => {
  const constraintName = `${tableName}_fk${index}`;
  const constraintSql = `
CONSTRAINT ${constraintName} FOREIGN KEY (${columnName}) REFERENCES ${property.references!}(id)
  `.trim();

  const indexSql = `
CREATE INDEX ${constraintName}_ix ON ${tableName} USING btree (${columnName});
  `.trim();

  return {
    index: indexSql,
    constraint: constraintSql,
  };
};
