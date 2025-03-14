"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { loginSchema } from '@/lib/validations/auth';
import { useAuth } from '@/hooks/useAuth';

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  async function onSubmit(data: LoginFormValues) {
    console.log("[LoginForm] 开始登录流程:", { email: data.email });
    setIsLoading(true);

    try {
      const result = await login(data.email, data.password);
      console.log("[LoginForm] API 登录成功:", { 
        accessToken: result.accessToken ? `${result.accessToken.substring(0, 20)}...` : null,
        hasRefreshToken: !!result.refreshToken,
        user: result.user
      });
      
      if (!result.user || !result.accessToken || !result.refreshToken) {
        console.error("[LoginForm] API 返回的登录数据不完整:", {
          hasUser: !!result.user,
          hasAccessToken: !!result.accessToken,
          hasRefreshToken: !!result.refreshToken
        });
        throw new Error("登录数据不完整，请联系管理员");
      }
      
      // 使用 NextAuth 的 signIn 方法，传递用户信息
      console.log("[LoginForm] 调用 NextAuth signIn...");
      const signInResult = await signIn('credentials', {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: JSON.stringify(result.user),
        redirect: false,
      });
      console.log("[LoginForm] NextAuth signIn 结果:", signInResult);

      if (signInResult?.error) {
        console.error("[LoginForm] NextAuth signIn 失败:", signInResult.error);
        throw new Error(`认证失败: ${signInResult.error}`);
      }

      // 延迟一点时间确保会话已经建立
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log("[LoginForm] 登录成功，准备跳转到 /boxes");
      router.push('/boxes');
      router.refresh();
    } catch (error) {
      console.error("[LoginForm] 登录失败:", error);
      toast.error('登录失败', {
        description: error instanceof Error ? error.message : '请检查您的邮箱和密码',
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
                    autoComplete="current-password"
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
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>记住我</FormLabel>
                </div>
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '登录中...' : '登录'}
          </Button>
        </form>
      </Form>
    </div>
  );
} 