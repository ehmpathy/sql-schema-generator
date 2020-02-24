import { Entity } from '../../../../../types';
import { prop } from '../../../../define';
import { throwErrorIfAnythingNotUnderscoreCase } from './throwErrorIfAnythingNotUnderscoreCase';

describe('throwErrorIfAnythingNotUnderscoreCase', () => {
  it('should throw an error if entity name is not underscore case', () => {
    const treeHouse = new Entity({ name: 'treeHouse', properties: { name: prop.VARCHAR(255) }, unique: ['name'] });
    try {
      throwErrorIfAnythingNotUnderscoreCase({ entity: treeHouse });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        "the name of entity 'treeHouse' must be in underscore_case, as that is the standard in sql",
      );
    }
  });
  it('should throw an error if any property of an entity is not in underscore case', () => {
    const treeHouse = new Entity({
      name: 'tree_house',
      properties: {
        name: prop.VARCHAR(255),
        dateBuilt: prop.DATETIME(6),
      },
      unique: ['name'],
    });
    try {
      throwErrorIfAnythingNotUnderscoreCase({ entity: treeHouse });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual(
        "property 'dateBuilt' of entity 'tree_house' must be in underscore_case, as that is the standard in sql",
      );
    }
  });
  it('should not throw error if everything is in underscore case', () => {
    const treeHouse = new Entity({
      name: 'tree_house',
      properties: {
        name: prop.VARCHAR(255),
        date_built: prop.DATETIME(6),
      },
      unique: ['name'],
    });
    throwErrorIfAnythingNotUnderscoreCase({ entity: treeHouse });
  });
});
