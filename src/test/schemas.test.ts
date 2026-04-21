import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema, checkoutSchema } from '@shared/lib/schemas';

describe('loginSchema', () => {
  it('يقبل بيانات صحيحة', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: 'pass123' });
    expect(result.success).toBe(true);
  });

  it('يرفض بريد إلكتروني فارغ', () => {
    const result = loginSchema.safeParse({ email: '', password: 'pass123' });
    expect(result.success).toBe(false);
  });

  it('يرفض بريد إلكتروني غير صحيح', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'pass123' });
    expect(result.success).toBe(false);
  });

  it('يرفض password فارغ', () => {
    const result = loginSchema.safeParse({ email: 'user@example.com', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const validData = {
    username: 'user_test',
    email: 'test@email.com',
    password: 'Password1',
    password2: 'Password1',
    phone: '0512345678',
    wilaya: 'Alger',
  };

  it('يقبل بيانات صحيحة', () => {
    const result = registerSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('يرفض كلمة مرور قصيرة', () => {
    const result = registerSchema.safeParse({ ...validData, password: 'abc', password2: 'abc' });
    expect(result.success).toBe(false);
  });

  it('يرفض رقم هاتف غير صحيح', () => {
    const result = registerSchema.safeParse({ ...validData, phone: '123456' });
    expect(result.success).toBe(false);
  });

  it('يرفض عند عدم تطابق كلمتي المرور', () => {
    const result = registerSchema.safeParse({ ...validData, password2: 'Different1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('password2');
    }
  });

  it('يرفض بريد إلكتروني غير صحيح', () => {
    const result = registerSchema.safeParse({ ...validData, email: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('يرفض username يحتوي على أحرف خاصة', () => {
    const result = registerSchema.safeParse({ ...validData, username: 'user@name!' });
    expect(result.success).toBe(false);
  });
});

describe('checkoutSchema', () => {
  const validData = {
    full_name: 'محمد أمين',
    phone: '0661234567',
    wilaya: 'Alger',
    address: 'شارع باب الوادي رقم 10',
    payment_method: 'cod' as const,
  };

  it('يقبل بيانات صحيحة', () => {
    const result = checkoutSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('يرفض عنوان قصير جداً', () => {
    const result = checkoutSchema.safeParse({ ...validData, address: 'abc' });
    expect(result.success).toBe(false);
  });

  it('يرفض طريقة دفع غير معروفة', () => {
    const result = checkoutSchema.safeParse({ ...validData, payment_method: 'bitcoin' });
    expect(result.success).toBe(false);
  });
});
