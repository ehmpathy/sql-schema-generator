// split out to make tit easier to test, and for historical reasons; can be merged if desired
export const readDeclarationFile = async ({
  declarationsPath,
}: {
  declarationsPath: string;
}) => {
  try {
    return await import(declarationsPath);
  } catch (error) {
    console.error(error);
    throw error;
  }
};
