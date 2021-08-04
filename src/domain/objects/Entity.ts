import { DomainObject } from 'domain-objects';
import Joi from 'joi';
import { Property } from './Property';

const schema = Joi.object().keys({
  name: Joi.string().required(),
  properties: Joi.object().pattern(/^/, Property.schema), // any key names, validate all against Property.schema
  unique: Joi.array()
    .items(Joi.string())
    .required(), // always require unique, as otherwise idempotency is not possible
});
export interface Entity {
  name: string;
  properties: {
    [index: string]: Property;
  };
  unique: string[];
}
export class Entity extends DomainObject<Entity> implements Entity {
  public static schema = schema;
}

// also export properties as its own type since its commonly referenced / is a common alias in natural language
export type Properties = Entity['properties'];
