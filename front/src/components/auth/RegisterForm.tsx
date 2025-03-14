"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { registerSchema } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/useAuth';

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(data: RegisterFormValues) {
    console.log("[RegisterForm] 开始注册流程:", { username: data.username, email: data.email });
    setIsLoading(true);

    try {
      const result = await register(data.username, data.email, data.password);
      console.log("[RegisterForm] API 注册成功:", { 
        accessToken: result.accessToken ? `${result.accessToken.substring(0, 20)}...` : null,
        hasRefreshToken: !!result.refreshToken,
        user: result.user
      });
      
      if (!result.user || !result.accessToken || !result.refreshToken) {
        console.error("[RegisterForm] API 返回的注册数据不完整:", {
          hasUser: !!result.user,
          hasAccessToken: !!result.accessToken,
          hasRefreshToken: !!result.refreshToken
        });
        throw new Error("注册数据不完整，请联系管理员");
      }
      
      // 使用 NextAuth 的 signIn 方法，传递用户信息
      console.log("[RegisterForm] 调用 NextAuth signIn...");
      const signInResult = await signIn('credentials', {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: JSON.stringify(result.user),
        redirect: false,
      });
      console.log("[RegisterForm] NextAuth signIn 结果:", signInResult);

      if (signInResult?.error) {
        console.error("[RegisterForm] NextAuth signIn 失败:", signInResult.error);
        throw new Error(`认证失败: ${signInResult.error}`);
      }

      toast.success('注册成功', {
        description: '欢迎加入FreshBox！',
      });
      
      // 延迟一点时间确保会话已经建立
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("[RegisterForm] 注册成功，准备跳转到 /boxes");
      router.push('/boxes');
      router.refresh();
    } catch (error) {
      console.error("[RegisterForm] 注册失败:", error);
      toast.error('注册失败', {
        description: error instanceof Error ? error.message : '请检查您的输入',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>用户名</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入用户名"
                    autoCapitalize="none"
                    autoComplete="username"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>邮箱</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入邮箱"
                    type="email"
                    autoCapitalize="none"
                    autoComplete="email"
                    autoCorrect="off"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>密码</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请输入密码"
                    type="password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>确认密码</FormLabel>
                <FormControl>
                  <Input
                    placeholder="请再次输入密码"
                    type="password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '注册中...' : '注册'}
          </Button>
        </form>
      </Form>
    </div>
  );
} 