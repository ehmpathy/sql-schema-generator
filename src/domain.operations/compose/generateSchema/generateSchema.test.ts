import { generateAndRecordEntitySchema } from './generateAndRecordEntitySchema';
import { generateSchema } from './generateSchema';
import { normalizeDeclarationContents } from './normalizeDeclarationContents';
import { readConfig } from './readConfig';
import { readDeclarationFile } from './readDeclarationFile';

jest.mock('./readConfig');
const readConfigMock = readConfig as jest.Mock;
readConfigMock.mockReturnValue({
  declarationsPath: '__DECLARATIONS_PATH__',
  targetDirPath: '__TARGET_DIR_PATH__',
});

jest.mock('./readDeclarationFile');
const readDeclarationFileMock = readDeclarationFile as jest.Mock;
readDeclarationFileMock.mockResolvedValue('__DECLARATION_CONTENTS__');

jest.mock('./normalizeDeclarationContents');
const normalizeDeclarationContentsMock =
  normalizeDeclarationContents as jest.Mock;
normalizeDeclarationContentsMock.mockResolvedValue({
  entities: [{ name: '__ENTITY_ONE__' }, { name: '__ENTITY_TWO__' }],
});

jest.mock('./generateAndRecordEntitySchema');
const generateAndRecordEntitySchemaMock =
  generateAndRecordEntitySchema as jest.Mock;

describe('generateSchema', () => {
  beforeEach(() => jest.clearAllMocks());
  it('should read the declaration file', async () => {
    await generateSchema({
      configPath: '__CONFIG_PATH__',
    });
    expect(readDeclarationFileMock.mock.calls.length).toEqual(1);
    expect(readDeclarationFileMock.mock.calls[0][0]).toMatchObject({
      declarationsPath: '__DECLARATIONS_PATH__',
    });
  });
  it('should extract entities from the contents of the declaration file', async () => {
    await generateSchema({
      configPath: '__CONFIG_PATH__',
    });
    expect(normalizeDeclarationContentsMock.mock.calls.length).toEqual(1);
    expect(normalizeDeclarationContentsMock.mock.calls[0][0]).toMatchObject({
      contents: '__DECLARATION_CONTENTS__',
    });
  });
  it('should generateAndRecordEntitySchema for each entity defined in the config', async () => {
    await generateSchema({
      configPath: '__CONFIG_PATH__',
    });
    expect(generateAndRecordEntitySchemaMock.mock.calls.length).toEqual(2);
    expect(generateAndRecordEntitySchemaMock.mock.calls[0][0]).toMatchObject({
      entity: { name: '__ENTITY_ONE__' },
      targetDirPath: '__TARGET_DIR_PATH__',
    });
    expect(generateAndRecordEntitySchemaMock.mock.calls[1][0]).toMatchObject({
      entity: { name: '__ENTITY_TWO__' },
      targetDirPath: '__TARGET_DIR_PATH__',
    });
  });
});
