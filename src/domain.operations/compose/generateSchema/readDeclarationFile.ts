// split out to make it easier to test, and for historical reasons; can be merged if desired
export const readDeclarationFile = async ({
  declarationsPath,
}: {
  declarationsPath: string;
}) => {
  try {
    const module = await import(declarationsPath);
    // handle CJS/ESM interop - exports may be wrapped in default
    return module.default ?? module;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
