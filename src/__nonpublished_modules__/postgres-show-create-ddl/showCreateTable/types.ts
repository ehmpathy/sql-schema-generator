import { QueryResult } from 'pg';

export interface DatabaseConnection {
  query: (args: { sql: string; values?: (string | number)[] }) => Promise<QueryResult<any>>;
  end: () => Promise<void>;
}
