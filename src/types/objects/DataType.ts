import Joi from 'joi';
import SchematicJoiModel from 'schematic-joi-model';
import { DataTypeName } from '../constants';

/*
  naming from https://dev.mysql.com/doc/refman/8.0/en/data-types.html and https://www.postgresql.org/docs/9.5/datatype.html
*/

const dataTypeSchema = Joi.object().keys({
  name: Joi.string().valid(Object.values(DataTypeName)),
  precision: Joi.number().optional(),
  scale: Joi.number().optional(),
});

interface DataTypeConstructorProps {
  name: DataTypeName;
  precision?: number;
  scale?: number;
}
export class DataType extends SchematicJoiModel<DataTypeConstructorProps> {
  public name!: DataTypeName;
  public precision?: number;
  public scale?: number;
  public static schema = dataTypeSchema;
}
