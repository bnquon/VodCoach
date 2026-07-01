export const PASSWORD_MIN_LENGTH = 7;

export const PASSWORD_REQUIREMENTS = [
  `At least ${PASSWORD_MIN_LENGTH} characters`,
  "One uppercase letter",
  "One symbol",
] as const;

export function validatePasswordStrength(password: string) {
  return (
    password.length >= PASSWORD_MIN_LENGTH &&
    /[A-Z]/.test(password) &&
    /[^\dA-Za-z]/.test(password)
  );
}

export function getPasswordStrengthError(password: string) {
  return validatePasswordStrength(password)
    ? null
    : `Password must be at least ${PASSWORD_MIN_LENGTH} characters and include an uppercase letter and a symbol.`;
}
