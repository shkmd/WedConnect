import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';
describe('worker config', () => { it('loads safe isolated defaults', () => { expect(loadConfig({})).toEqual({healthPort:4001}); }); });
