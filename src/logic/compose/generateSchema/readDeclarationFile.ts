// split out to make tit easier to test, and for historical reasons; can be merged if desired
export const readDeclarationFile = async ({
  declarationsPath,
}: {
  declarationsPath: string;
}) => {
  return require(declarationsPath);
};
