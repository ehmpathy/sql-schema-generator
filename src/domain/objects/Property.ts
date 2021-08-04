import { DomainObject } from 'domain-objects';
import Joi from 'joi';

import { DataType } from './DataType';

/*
  naming from https://dev.mysql.com/doc/refman/8.0/en/create-table.html
*/
const schema = Joi.object().keys({
  type: DataType.schema,
  references: Joi.string().optional(), // entity name
  check: Joi.string().optional(),
  default: Joi.string().optional(),
  updatable: Joi.boolean().optional(),
  nullable: Joi.boolean().optional(),
  array: Joi.boolean().optional(),
  comment: Joi.string().optional(),
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
