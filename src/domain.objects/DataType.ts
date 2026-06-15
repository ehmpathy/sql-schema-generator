import { DomainObject } from 'domain-objects';
import { z } from 'zod';

import { DataTypeName } from './constants';

/*
  naming from https://dev.mysql.com/doc/refman/8.0/en/data-types.html and https://www.postgresql.org/docs/9.5/datatype.html
*/
const schema = z.object({
  name: z.enum(Object.values(DataTypeName) as [string, ...string[]]),
  precision: z.number().optional(),
  scale: z.number().optional(),
});

export interface DataType {
  name: DataTypeName;
  precision?: number;
  scale?: number;
}
export class DataType extends DomainObject<DataType> {
  public static schema = schema;
}
