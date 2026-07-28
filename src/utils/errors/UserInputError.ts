export class UserInputError extends Error {
  constructor({
    reason,
    domainObjectName,
    domainObjectPropertyName,
    potentialSolution,
  }: {
    reason: string;
    domainObjectName?: string;
    domainObjectPropertyName?: string;
    potentialSolution?: string;
  }) {
    // build the sentences a human reads, then join with a space so the class-name
    // prefix does not glue onto the reason (e.g. "error.prop.ARRAY_OF" reads as one
    // dotted token). undefined clauses are filtered so no double space appears.
    const sentences = [
      'User input error.',
      `${reason.replace(/\.$/, '')}.`,
      domainObjectName
        ? `'${domainObjectName}${
            domainObjectPropertyName ? `.${domainObjectPropertyName}` : ''
          }' does not meet this criteria.`
        : undefined,
    ].filter((part): part is string => part !== undefined);

    // the solution block carries its own newlines up front; append it (and the
    // final newline) directly so no stray space precedes a line break.
    const solution = potentialSolution
      ? `\n\nFor potential solutions, consider the following:${potentialSolution}`
      : '';

    super(`${sentences.join(' ')}${solution}\n`);
  }
}
