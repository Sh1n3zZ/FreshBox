import * as z from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('邮箱格式不正确'),
  password: z
    .string()
    .min(6, '密码至少6位')
    .max(32, '密码最多32位'),
  rememberMe: z.boolean().default(false),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(2, '用户名至少2位')
    .max(32, '用户名最多32位'),
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('邮箱格式不正确'),
  password: z
    .string()
    .min(6, '密码至少6位')
    .max(32, '密码最多32位'),
  confirmPassword: z
    .string()
    .min(1, '请确认密码'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});
