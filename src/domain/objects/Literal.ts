import { Entity } from './Entity';
import { Property } from './Property';

/*
  turns out: Domain Literals, from a persistance perspective, are just like Domain Entities - except with more constraints:
    - i.e., no updatable values
    - i.e., it is unique on all properties
*/
interface LiteralConstructorProps {
  name: string;
  properties: {
    [index: string]: Omit<Property, 'updatable'>; // by definition, literals are not updatable
  };
}
export class Literal extends Entity {
  constructor(props: LiteralConstructorProps) {
    // 1. check that all the properties are immutable; this shouldn't be allowed w/ type checking but lets run time validate it too
    const updateableProperties = Object.keys(props.properties).filter(
      (propertyName) => {
        const property = props.properties[propertyName];
        if ((property as Property).updatable) return true;
        return false;
      },
    );
    if (updateableProperties.length)
      throw new Error(
        'literals can not have updateable properties, by definition',
      );

    // 2. define the unique condition automatically, as all properties
    const unique = Object.keys(props.properties);

    // 3. implement as an entity with the above conditions
    super({ ...props, unique });
  }
}
