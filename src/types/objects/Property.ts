import Joi from 'joi';
import SchematicJoiModel from 'schematic-joi-model';
import { DataType } from './DataType';

/*
  naming from https://dev.mysql.com/doc/refman/8.0/en/create-table.html
*/
const propertySchema = Joi.object().keys({
  type: DataType.schema,
  references: Joi.string().optional(), // entity name
  check: Joi.string().optional(),
  default: Joi.string().optional(),
  updatable: Joi.boolean().optional(),
  nullable: Joi.boolean().optional(),
  comment: Joi.string().optional(),
});
interface PropertyConstructorProps {
  type: DataType;
  references?: string;
  check?: string;
  default?: string;
  updatable?: boolean;
  nullable?: boolean;
  comment?: string;
}
export class Property extends SchematicJoiModel<PropertyConstructorProps> {
  public type!: DataType;
  public references?: string;
  public check?: string;
  public default?: string;
  public updatable?: boolean;
  public nullable?: boolean;
  public comment?: string;
  public static schema = propertySchema;
}
