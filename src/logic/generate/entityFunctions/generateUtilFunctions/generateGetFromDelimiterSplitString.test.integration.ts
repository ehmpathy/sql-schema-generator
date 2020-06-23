import { DatabaseConnection, getDatabaseConnection } from '../../../../__test_utils__/databaseConnection';
import { generateGetFromDelimiterSplitString } from './generateGetFromDelimiterSplitString';

describe('generateGetValueFromDelimiterSplitString', () => {
  let dbConnection: DatabaseConnection;
  beforeAll(async () => {
    dbConnection = await getDatabaseConnection();
  });
  afterAll(async () => {
    await dbConnection.end();
  });

  const recreateUtilFunction = async () => {
    const { sql, name } = generateGetFromDelimiterSplitString();
    await dbConnection.query({ sql: `DROP FUNCTION IF EXISTS ${name}` });
    dbConnection.query({ sql });
    return { sql, name };
  };
  it('should produce the same syntax as the SHOW CREATE FUNCTION query', async () => {
    const { sql, name } = await recreateUtilFunction();
    const result = (await dbConnection.query({
      sql: `SHOW CREATE FUNCTION ${name}`,
    })) as any;
    const showCreateSql = result[0][0]['Create Function'].replace(' DEFINER=`root`@`%`', ''); // ignoring the definer part
    expect(sql).toEqual(showCreateSql);
    expect(sql).toMatchSnapshot();
  });
  const getFromDelimiterSplitString = async ({
    string,
    delimiter,
    index,
  }: {
    string: string;
    delimiter: string;
    index: number;
  }) => {
    const result = (await dbConnection.query({
      sql: `SELECT get_from_delimiter_split_string('${string}', '${delimiter}', ${index}) as value`,
    })) as any;
    return result[0][0].value;
  };
  it('should return the correct value at index 0', async () => {
    const value = await getFromDelimiterSplitString({ string: '821,5,3,7,4', delimiter: ',', index: 0 });
    expect(value).toEqual('821');
  });
  it('should return the correct value at random index', async () => {
    const value = await getFromDelimiterSplitString({ string: '821,5,3,7,4', delimiter: ',', index: 3 });
    expect(value).toEqual('7');
  });
  it('should return empty string when index is out of bounds', async () => {
    const value = await getFromDelimiterSplitString({ string: '821,5,3,7,4', delimiter: ',', index: 10 });
    expect(value).toEqual('');
  });
  it('should return empty string when index is negative', async () => {
    const value = await getFromDelimiterSplitString({ string: '821,5,3,7,4', delimiter: ',', index: -1 });
    expect(value).toEqual('');
  });
});
