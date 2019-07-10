import { Entity } from '../../../types';
import { normalizeDeclarationContents } from './normalizeDeclarationContents';

describe('normalizeDeclarationContents', () => {
  it('should throw an error if an entities object is not exported from the source file', () => {
    const contents = { ontities: [] };
    try {
      normalizeDeclarationContents({ contents });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual('an entities array must be exported by the source file');
    }
  });
  it('throw an error if entities are not all of class Entity', () => {
    const contents = { entities: ['not an Entity'] };
    try {
      normalizeDeclarationContents({ contents });
      throw new Error('should not reach here');
    } catch (error) {
      expect(error.message).toEqual('all exported entities must be of class Entity');
    }
  });
  it('should return the entities found in the contents', () => {
    const contents = { entities: [new Entity({ name: 'name', properties: {}, unique: [] })] };
    const { entities } = normalizeDeclarationContents({ contents });
    expect(entities).toEqual(contents.entities);
  });
});
