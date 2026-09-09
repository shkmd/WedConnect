import { describe, expect, it } from 'vitest';
import { otpRequestSchema, otpVerifySchema } from '../src/identity/auth.service';

describe('OTP validation', () => {
  it('accepts E.164 phone numbers and self-selectable roles', () => {
    expect(otpRequestSchema.safeParse({ phone: '+919876543210', roleIntent: 'CUSTOMER' }).success).toBe(true);
  });
  it('rejects local phone formats and privileged role selection', () => {
    expect(otpRequestSchema.safeParse({ phone: '9876543210', roleIntent: 'SUPER_ADMIN' }).success).toBe(false);
  });
  it('requires a six-digit OTP and explicit client kind', () => {
    expect(otpVerifySchema.safeParse({ phone: '+919876543210', roleIntent: 'VENDOR_OWNER', token: '123456', clientKind: 'mobile' }).success).toBe(true);
    expect(otpVerifySchema.safeParse({ phone: '+919876543210', roleIntent: 'VENDOR_OWNER', token: '1234', clientKind: 'web' }).success).toBe(false);
  });
});
