import { Entity } from '../../../../../domain';
import { prop } from '../../../../define';
import { throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix } from './throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix';
import { throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix } from './throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix';
import { throwErrorIfAnythingNotUnderscoreCase } from './throwErrorIfAnythingNotUnderscoreCase';
import { throwErrorIfNamingConventionsNotFollowed } from './throwErrorIfNamingConventionsNotFollowed';

jest.mock('./throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix');
const throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffixMock =
  throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix;

jest.mock('./throwErrorIfAnythingNotUnderscoreCase');
const throwErrorIfAnythingNotUnderscoreCaseMock =
  throwErrorIfAnythingNotUnderscoreCase;

jest.mock('./throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix');
const throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffixMock =
  throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix;

describe('throwErrorIfNamingConventionsNotFollowed', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffix', () => {
    const exampleEntity = new Entity({
      name: 'user',
      properties: { name: prop.VARCHAR(255) },
      unique: ['name'],
    });
    throwErrorIfNamingConventionsNotFollowed({ entity: exampleEntity });
    expect(
      throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffixMock,
    ).toHaveBeenCalledTimes(1);
    expect(
      throwErrorIfAnyReferencePropertyDoesNotHaveExplicitSuffixMock,
    ).toHaveBeenCalledWith({
      entity: exampleEntity,
    });
  });
  it('should throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffix', () => {
    const exampleEntity = new Entity({
      name: 'user',
      properties: { name: prop.VARCHAR(255) },
      unique: ['name'],
    });
    throwErrorIfNamingConventionsNotFollowed({ entity: exampleEntity });
    expect(
      throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffixMock,
    ).toHaveBeenCalledTimes(1);
    expect(
      throwErrorIfAnyUuidPropertyDoesNotHaveExplicitSuffixMock,
    ).toHaveBeenCalledWith({
      entity: exampleEntity,
    });
  });
  it('should throwErrorIfAnythingNotUnderscoreCase', () => {
    const exampleEntity = new Entity({
      name: 'user',
      properties: { name: prop.VARCHAR(255) },
      unique: ['name'],
    });
    throwErrorIfNamingConventionsNotFollowed({ entity: exampleEntity });
    expect(throwErrorIfAnythingNotUnderscoreCaseMock).toHaveBeenCalledTimes(1);
    expect(throwErrorIfAnythingNotUnderscoreCaseMock).toHaveBeenCalledWith({
      entity: exampleEntity,
    });
  });
});
