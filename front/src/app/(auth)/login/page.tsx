import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: '登录 | FreshBox',
  description: '登录您的FreshBox账号',
};

export default function LoginPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900">
          <div
            className="absolute inset-0 bg-cover"
            style={{
              backgroundImage: 'url(/images/auth-bg.jpg)',
              opacity: 0.5,
            }}
          />
        </div>
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🥗</span>
            <span>FreshBox</span>
          </Link>
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "通过FreshBox，我们不仅能以优惠的价格购买到美味的食品，更重要的是为环保事业贡献了一份力量。"
            </p>
            <footer className="text-sm">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader>
              <CardTitle>欢迎回来</CardTitle>
              <CardDescription>
                请登录您的账号以继续使用FreshBox的服务
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LoginForm />
            </CardContent>
          </Card>
          <p className="px-8 text-center text-sm text-muted-foreground">
            还没有账号？{' '}
            <Link
              href="/register"
              className="underline underline-offset-4 hover:text-primary"
            >
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 