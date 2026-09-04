import { describe, it, expect } from 'vitest';
import { analyzeAddress } from '../src/engine/addressAnalyzer';

describe('Address Analyzer', () => {
  it('assigns low risk to complete, well-formatted addresses', () => {
    const result = analyzeAddress({
      line1: '42, Sector 15, Vasant Kunj',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110070',
      landmark: 'Near DLF Mall',
    });

    expect(result.risk).toBeLessThan(30);
    expect(result.quality).toBeGreaterThan(60);
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('assigns elevated risk to short or vague addresses', () => {
    const result = analyzeAddress({
      line1: 'flat 2',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001',
    });

    expect(result.risk).toBeGreaterThan(30);
    expect(result.signals).toContain('Very short address');
  });

  it('detects invalid pincode formats', () => {
    const result = analyzeAddress({
      line1: '123 Test Street, Some Locality',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '12345', // only 5 digits
    });

    expect(result.signals).toContain('Invalid pincode format');
  });

  it('detects pincode-city mismatch', () => {
    const result = analyzeAddress({
      line1: 'Flat 101, Palm Grove, Koramangala',
      city: 'Mumbai', // Mismatch with Bangalore pincode
      state: 'Karnataka',
      pincode: '560034',
    });

    expect(result.signals.some(s => s.includes('Pincode-city mismatch'))).toBe(true);
  });
});
