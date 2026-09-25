/**
 * Sign-up rules shared by the browser (live validation in the sign-up form) and the server
 * (src/lib/auth/flow.ts), so both always agree. No imports: safe in client and server code.
 */
export const MIN_PASSWORD_LENGTH = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = (email: string) => EMAIL_PATTERN.test(email);

export type SignUpField = 'name' | 'email' | 'password' | 'password_confirm';
export type SignUpValues = Record<SignUpField, string>;

/** Which rule a field breaks (the form shows it in the page language, ADR 0011). */
export type SignUpProblem = 'name' | 'email' | 'password' | 'mismatch';

export function validateSignUp(v: SignUpValues): Partial<Record<SignUpField, SignUpProblem>> {
  const errors: Partial<Record<SignUpField, SignUpProblem>> = {};
  if (!v.name.trim()) errors.name = 'name';
  if (!isEmail(v.email.trim().toLowerCase())) errors.email = 'email';
  if (v.password.length < MIN_PASSWORD_LENGTH) errors.password = 'password';
  if (v.password_confirm !== v.password) errors.password_confirm = 'mismatch';
  return errors;
}
