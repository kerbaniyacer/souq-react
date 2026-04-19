import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, 'البريد الإلكتروني أو اسم المستخدم مطلوب'),
  password: z.string().min(1, 'كلمة المرور مطلوبة'),
});

export const registerSchema = z.object({
  username: z.string()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل')
    .max(30, 'اسم المستخدم يجب ألا يتجاوز 30 حرفاً')
    .regex(/^[a-zA-Z0-9_]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام وشرطة سفلية فقط'),
  email: z.string().min(1, 'البريد الإلكتروني مطلوب').email('البريد الإلكتروني غير صحيح'),
  password: z.string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل'),
  password2: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
  phone: z.string()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(/^(05|06|07)[0-9]{8}$/, 'رقم الهاتف غير صحيح (مثال: 0512345678)'),
  wilaya: z.string().min(1, 'يرجى اختيار الولاية'),
  baladia: z.string().optional().default(''),
  address: z.string().optional().default(''),
  store_name: z.string().optional().default(''),
  store_description: z.string().optional().default(''),
  store_category: z.string().optional().default(''),
}).refine((data) => data.password === data.password2, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['password2'],
});

export const checkoutSchema = z.object({
  full_name: z.string().min(2, 'الاسم الكامل مطلوب'),
  phone: z.string()
    .min(1, 'رقم الهاتف مطلوب')
    .regex(/^(05|06|07)[0-9]{8}$/, 'رقم الهاتف غير صحيح'),
  wilaya: z.string().min(1, 'يرجى اختيار الولاية'),
  baladia: z.string().optional().default(''),
  address: z.string().min(5, 'العنوان التفصيلي مطلوب (5 أحرف على الأقل)'),
  payment_method: z.enum(['cod', 'card']).refine((v) => ['cod', 'card'].includes(v), { message: 'يرجى اختيار طريقة الدفع' }),
  notes: z.string().optional().default(''),
});

export const changePasswordSchema = z.object({
  old_password: z.string().min(1, 'كلمة المرور الحالية مطلوبة'),
  new_password: z.string()
    .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل')
    .regex(/[A-Z]/, 'يجب أن تحتوي على حرف كبير واحد على الأقل')
    .regex(/[0-9]/, 'يجب أن تحتوي على رقم واحد على الأقل'),
  confirm_password: z.string().min(1, 'تأكيد كلمة المرور مطلوب'),
}).refine((data) => data.new_password === data.confirm_password, {
  message: 'كلمتا المرور غير متطابقتان',
  path: ['confirm_password'],
});

export const productSchema = z.object({
  name: z.string().min(2, 'اسم المنتج مطلوب (حرفان على الأقل)'),
  description: z.string().min(10, 'الوصف يجب أن يكون 10 أحرف على الأقل'),
  category: z.string().min(1, 'يرجى اختيار الفئة'),
  brand: z.string().optional().default(''),
  is_featured: z.boolean().optional().default(false),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CheckoutFormData = z.infer<typeof checkoutSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ProductFormData = z.infer<typeof productSchema>;
