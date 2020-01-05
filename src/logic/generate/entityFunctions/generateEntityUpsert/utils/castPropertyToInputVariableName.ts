/*
  takes a property name and converts it into what we would define the upsert input name to be
*/
export const castPropertyToInputVariableName = ({ name }: { name: string }) => `in_${name}`;
