import Joi from 'joi';
import SchematicJoiModel from 'schematic-joi-model';
import { Property } from './Property';

// we define properties here as well, as this is a common type due to the entity
export interface Properties {
  [index: string]: Property;
}

const entitySchema = Joi.object().keys({
  name: Joi.string().required(),
  properties: Joi.object().pattern(
    /^/,
    Joi.lazy(() => Property.schema),
  ), // any key names, validate all against Property.schema; lazy since recursive
  unique: Joi.array()
    .items(Joi.string())
    .required(), // always require unique, as otherwise idempotency is not possible
});
interface EntityConstructorProps {
  name: string;
  properties: Properties;
  unique: string[];
}
export class Entity extends SchematicJoiModel<EntityConstructorProps> {
  public name!: string;
  public properties!: Properties;
  public unique!: string[];
  public static schema = entitySchema;
}
