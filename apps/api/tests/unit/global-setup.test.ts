import { describe, it, expect } from 'vitest';
import { assertTestDatabase } from '../global-setup.js';

describe('assertTestDatabase', () => {
  it('accepts a database whose name ends with _test', () => {
    expect(() =>
      assertTestDatabase(
        'postgresql://u:p@127.0.0.1:5434/HiveMind_test',
        false,
      ),
    ).not.toThrow();
  });

  it('refuses the dev database outside CI', () => {
    expect(() =>
      assertTestDatabase('postgresql://u:p@127.0.0.1:5434/HiveMind', false),
    ).toThrow('Refusing to run tests against "HiveMind"');
  });

  it('refuses a missing database URL outside CI', () => {
    expect(() => assertTestDatabase(undefined, false)).toThrow('no database');
  });

  it('accepts any database in CI', () => {
    expect(() =>
      assertTestDatabase('postgresql://u:p@localhost:5432/hivemind', true),
    ).not.toThrow();
  });
});
