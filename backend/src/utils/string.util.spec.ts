import { snakeToCamel } from './string.util';

describe('snakeToCamel', () => {
  it('converts a single underscore segment', () => {
    expect(snakeToCamel('hello_world')).toBe('helloWorld');
  });

  it('converts multiple underscore segments', () => {
    expect(snakeToCamel('nguoi_hoc_info')).toBe('nguoiHocInfo');
  });

  it('leaves a single word unchanged', () => {
    expect(snakeToCamel('students')).toBe('students');
  });

  it('converts kebab-case (hyphens) to camelCase', () => {
    expect(snakeToCamel('my-table-name')).toBe('myTableName');
  });

  it('returns empty string for empty input', () => {
    expect(snakeToCamel('')).toBe('');
  });

  it('does not capitalise the first letter', () => {
    expect(snakeToCamel('user_id')[0]).toBe('u');
  });
});
