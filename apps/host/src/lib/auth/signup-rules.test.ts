import { describe, expect, it } from 'vitest';
import { MIN_PASSWORD_LENGTH as MIN_PASSWORD, validateSignUp as validate } from './signup-rules';

const ok = {
  name: 'Ana',
  email: 'ana@example.com',
  password: 'a'.repeat(MIN_PASSWORD),
  password_confirm: 'a'.repeat(MIN_PASSWORD),
};

describe('sign-up validation', () => {
  it('accepts a complete, valid form', () => {
    expect(validate(ok)).toEqual({});
  });

  it('checks name, email format, password length and confirmation', () => {
    const errors = validate({
      name: '  ',
      email: 'ana@example',
      password: 'short',
      password_confirm: 'shorts',
    });
    expect(Object.keys(errors).sort()).toEqual(['email', 'name', 'password', 'password_confirm']);
    expect(errors.password).toContain(`5/${MIN_PASSWORD}`);
  });

  it('uses the same email rule as the server', () => {
    for (const bad of ['ana', 'ana@', '@example.com', 'ana@example.c', 'a na@example.com']) {
      expect(validate({ ...ok, email: bad }).email, bad).toBeDefined();
    }
    expect(validate({ ...ok, email: ' ana@sub.example.co ' }).email).toBeUndefined();
  });

  it('flags a confirmation that no longer matches after the password changed', () => {
    expect(validate({ ...ok, password: 'b'.repeat(MIN_PASSWORD) }).password_confirm).toBeDefined();
  });
});
