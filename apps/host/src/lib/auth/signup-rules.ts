/**
 * Sign-up rules shared by the browser (live validation in the sign-up form) and the server
 * (src/lib/auth/flow.ts), so both always agree. No imports: safe in client and server code.
 */
export const MIN_PASSWORD_LENGTH = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const isEmail = (email: string) => EMAIL_PATTERN.test(email);

export type SignUpField = 'name' | 'email' | 'password' | 'password_confirm';
export type SignUpValues = Record<SignUpField, string>;

export function validateSignUp(v: SignUpValues): Partial<Record<SignUpField, string>> {
  const errors: Partial<Record<SignUpField, string>> = {};
  if (!v.name.trim()) errors.name = 'Please enter your name.';
  if (!isEmail(v.email.trim().toLowerCase())) {
    errors.email = 'Enter a valid email address, like name@example.com.';
  }
  if (v.password.length < MIN_PASSWORD_LENGTH) {
    errors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters (${v.password.length}/${MIN_PASSWORD_LENGTH}).`;
  }
  if (v.password_confirm !== v.password) errors.password_confirm = 'The passwords do not match.';
  return errors;
}
