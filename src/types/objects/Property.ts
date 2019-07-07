import Joi from 'joi';
import SchematicJoiModel from 'schematic-joi-model';
import { DataType } from './DataType';
import { Entity } from './Entity';

/*
  naming from https://dev.mysql.com/doc/refman/8.0/en/create-table.html
*/
const propertySchema = Joi.object().keys({
  type: DataType.schema,
  references: Joi.lazy(() => Entity.schema).optional(), // lazy since recursive
  updatable: Joi.boolean().optional(),
  nullable: Joi.boolean().optional(),
  comment: Joi.string().optional(),
});
interface PropertyConstructorProps {
  type: DataType;
  references?: Entity;
  updatable?: boolean;
  nullable?: boolean;
  comment?: string;
}
export class Property extends SchematicJoiModel<PropertyConstructorProps> {
  public type!: DataType;
  public references?: Entity;
  public updatable?: boolean;
  public nullable?: boolean;
  public comment?: string;
  public static schema = propertySchema;
}
