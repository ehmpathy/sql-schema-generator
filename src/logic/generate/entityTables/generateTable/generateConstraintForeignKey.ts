import { Property } from '../../../../domain';
import { defineConstraintNameSafely } from './defineConstraintNameSafely';

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
  const constraintName = `${tableName}`;
  const constraintSql = `
CONSTRAINT ${defineConstraintNameSafely({
    tableName,
    constraintName: `fk${index}`,
  })} FOREIGN KEY (${columnName}) REFERENCES ${property.references!} (id)
  `.trim();

  const indexSql = `
CREATE INDEX ${defineConstraintNameSafely({
    tableName,
    constraintName: `fk${index}_ix`,
  })} ON ${tableName} USING btree (${columnName});
  `.trim();

  return {
    index: indexSql,
    constraint: constraintSql,
  };
};
