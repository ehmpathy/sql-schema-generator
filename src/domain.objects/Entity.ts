import { DomainObject } from 'domain-objects';
import { z } from 'zod';

import { Property } from './Property';

const schema = z.object({
  name: z.string(),
  properties: z.record(z.string(), Property.schema),
  unique: z.array(z.string()),
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
