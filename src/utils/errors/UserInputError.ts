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
    super(
      [
        'User input error.',
        `${reason.replace(/\.$/, '')}.`,
        domainObjectName
          ? `'${domainObjectName}${
              domainObjectPropertyName ? `.${domainObjectPropertyName}` : ''
            }' does not meet this criteria.`
          : undefined,
        potentialSolution
          ? `\n\nFor potential solutions, consider the following:${potentialSolution}`
          : undefined,
        '\n',
      ].join(''),
    );
  }
}
