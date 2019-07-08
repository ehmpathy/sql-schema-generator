import Joi from 'joi';
import SchematicJoiModel from 'schematic-joi-model';
import { Property } from './Property';

/*
  naming from https://dev.mysql.com/doc/refman/8.0/en/create-table.html
*/
const entitySchema = Joi.object().keys({
  name: Joi.string().required(),
  properties: Joi.object().pattern(/^/, Joi.lazy(() => Property.schema)), // any key names, validate all against Property.schema; lazy since recursive
  unique: Joi.array().items(Joi.string()).required(), // always require unique, as otherwise idempotency is not possible
});
interface EntityConstructorProps {
  name: string;
  properties: { [index: string]: Property };
  unique: string[];
}
export class Entity extends SchematicJoiModel<EntityConstructorProps> {
  public name!: string;
  public properties!: { [index: string]: Property };
  public unique!: string[];
  public static schema = entitySchema;
}
