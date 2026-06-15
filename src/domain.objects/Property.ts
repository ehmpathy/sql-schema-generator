import { DomainObject } from 'domain-objects';
import { z } from 'zod';

import { DataType } from './DataType';

/*
  names from https://dev.mysql.com/doc/refman/8.0/en/create-table.html
*/
const schema = z.object({
  type: DataType.schema,
  references: z.string().optional(),
  check: z.string().optional(),
  default: z.string().optional(),
  updatable: z.boolean().optional(),
  nullable: z.boolean().optional(),
  array: z.boolean().optional(),
  comment: z.string().optional(),
});
export interface Property {
  type: DataType;
  references?: string;
  check?: string;
  default?: string;
  updatable?: boolean;
  nullable?: boolean;
  array?: boolean;
  comment?: string;
}
export class Property extends DomainObject<Property> implements Property {
  public static schema = schema;
  public static nested = { type: DataType };
}
