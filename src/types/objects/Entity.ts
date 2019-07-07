import Joi from 'joi';
import SchematicJoiModel from 'schematic-joi-model';
import { Property } from './Property';

/*
  naming from https://dev.mysql.com/doc/refman/8.0/en/create-table.html
*/
const entitySchema = Joi.object().keys({
  name: Joi.string().required(),
  properties: Joi.object().pattern(/^/, Joi.lazy(() => Property.schema)), // any key names, validate all against Property.schema; lazy since recursive
});
interface EntityConstructorProps {
  name: string;
  properties: { [index: string]: Property };
}
export class Entity extends SchematicJoiModel<EntityConstructorProps> {
  public name!: string;
  public properties!: { [index: string]: Property };
  public static schema = entitySchema;
}
