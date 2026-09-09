import { describe, expect, it } from 'vitest';
import { fieldInput, locationInput } from '../src/taxonomy/taxonomy.schemas';

describe('Module 3 taxonomy validation', () => {
  it('accepts a complete locality', () => expect(locationInput.parse({ parentId: '10000000-0000-4000-8000-000000000004', type: 'LOCALITY', name: 'Test Locality', slug: 'test-locality', latitude: 11, longitude: 77 })).toMatchObject({ type: 'LOCALITY' }));
  it('rejects incomplete coordinates', () => expect(() => locationInput.parse({ type: 'COUNTRY', name: 'India', slug: 'india', latitude: 11 })).toThrow());
  it('accepts a dynamic field definition', () => expect(fieldInput.parse({ key: 'guest_count', label: 'Guest count', fieldType: 'NUMBER', status: 'ACTIVE' })).toMatchObject({ required: false, status: 'ACTIVE' }));
});
