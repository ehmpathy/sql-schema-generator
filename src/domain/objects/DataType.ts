import { DomainObject } from 'domain-objects';
import Joi from 'joi';
import { DataTypeName } from '../constants';

/*
  naming from https://dev.mysql.com/doc/refman/8.0/en/data-types.html and https://www.postgresql.org/docs/9.5/datatype.html
*/
const schema = Joi.object().keys({
  name: Joi.string().valid(...Object.values(DataTypeName)),
  precision: Joi.number().optional(),
  scale: Joi.number().optional(),
});

export interface DataType {
  name: DataTypeName;
  precision?: number;
  scale?: number;
}
export class DataType extends DomainObject<DataType> {
  public static schema = schema;
}
