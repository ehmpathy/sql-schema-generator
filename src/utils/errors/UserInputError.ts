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
      `
User input error. ${reason.replace(/\.$/, '')}. '${domainObjectName}${
        domainObjectPropertyName ? `.${domainObjectPropertyName}` : ''
      }' does not meet this criteria. Please correct this and try again.${
        potentialSolution ? `\n\n${potentialSolution}` : ''
      }
    `.trim(),
    );
  }
}
