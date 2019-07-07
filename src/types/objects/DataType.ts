import Joi from 'joi';
import SchematicJoiModel from 'schematic-joi-model';
import { DataTypeName } from '../constants';

/*
  naming from https://dev.mysql.com/doc/refman/8.0/en/data-types.html and https://www.postgresql.org/docs/9.5/datatype.html
  - note: currently we only support mysql
*/

const dataTypeSchema = Joi.object().keys({
  name: Joi.string().valid(Object.values(DataTypeName)),
  precision: Joi.number().optional(), // only required on varchar, char, // TODO: throw an error if this should be defined but is not
  values: Joi.array().items(Joi.string(), Joi.number()).optional(), // only required on enum, set, // TODO: throw an error if this should be defined but is not
});

type StringOrNumber = string | number;
interface DataTypeConstructorProps {
  name: DataTypeName;
  precision?: number; // TODO: support multiple precision types
  values?: StringOrNumber[];
}
export class DataType extends SchematicJoiModel<DataTypeConstructorProps> {
  public name!: DataTypeName;
  public precision!: number;
  public values!: StringOrNumber[];
  public static schema = dataTypeSchema;
}
