import { describe, it, expect } from 'vitest';
import { parseCsv } from '../src/lib/fetch-network/csv';

describe('parseCsv', () => {
  it('parses a simple header + rows', () => {
    const input = 'a,b,c\n1,2,3\n4,5,6';
    expect(parseCsv(input)).toEqual([
      { a: '1', b: '2', c: '3' },
      { a: '4', b: '5', c: '6' },
    ]);
  });

  it('returns empty array for empty input', () => {
    expect(parseCsv('')).toEqual([]);
  });

  it('returns empty array for header only', () => {
    expect(parseCsv('a,b,c')).toEqual([]);
  });

  it('handles quoted fields containing commas', () => {
    const input = 'name,note\n"Hello, World",simple';
    expect(parseCsv(input)).toEqual([
      { name: 'Hello, World', note: 'simple' },
    ]);
  });

  it('handles quoted fields containing escaped quotes', () => {
    // Per RFC 4180, a double-quote inside a quoted field is escaped by doubling.
    const input = 'name,note\n"Say ""hi""",ok';
    expect(parseCsv(input)).toEqual([
      { name: 'Say "hi"', note: 'ok' },
    ]);
  });

  it('handles CRLF line endings', () => {
    const input = 'a,b\r\n1,2\r\n3,4';
    expect(parseCsv(input)).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('skips a trailing blank line', () => {
    const input = 'a,b\n1,2\n';
    expect(parseCsv(input)).toEqual([{ a: '1', b: '2' }]);
  });

  it('treats missing fields as empty strings', () => {
    const input = 'a,b,c\n1,2';
    expect(parseCsv(input)).toEqual([{ a: '1', b: '2', c: '' }]);
  });
});
