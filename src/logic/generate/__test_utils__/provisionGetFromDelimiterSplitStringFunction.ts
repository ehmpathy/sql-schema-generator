import { DatabaseConnection } from '.';
import { generateGetFromDelimiterSplitString } from '../entityFunctions/generateUtilFunctions/generateGetFromDelimiterSplitString';

export const provisionGetFromDelimiterSplitStringFunction = async ({
  dbConnection,
}: {
  dbConnection: DatabaseConnection;
}) => {
  const { sql, name } = generateGetFromDelimiterSplitString();
  await dbConnection.query({ sql: `DROP FUNCTION IF EXISTS ${name}` });
  dbConnection.query(sql);
};
