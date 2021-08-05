import { Entity } from './Entity';
import { Property } from './Property';

/*
  turns out: Domain Events, from a persistance perspective, are just like Domain Entities - except with more constraints:
    - i.e., no updatable values
*/
interface EventConstructorProps {
  name: string;
  properties: {
    [index: string]: Omit<Property, 'updatable'>; // by definition, value objects are not updatable
  };
  unique: string[];
}
export class Event extends Entity {
  constructor(props: EventConstructorProps) {
    // 1. check that all the properties are immutable; this shouldn't be allowed w/ type checking but lets run time validate it too
    const updateableProperties = Object.keys(props.properties).filter((propertyName) => {
      const property = props.properties[propertyName];
      if ((property as Property).updatable) return true;
      return false;
    });
    if (updateableProperties.length) throw new Error('events can not have updateable properties, by definition');

    // 3. implement as an entity with the above conditions
    super(props);
  }
}
