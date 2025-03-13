import Link from 'next/link';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata = {
  title: '注册 | FreshBox',
  description: '创建您的FreshBox账号',
};

export default function RegisterPage() {
  return (
    <div className="container relative min-h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader>
              <CardTitle>创建账号</CardTitle>
              <CardDescription>
                加入FreshBox，开启您的可持续生活方式
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RegisterForm />
            </CardContent>
          </Card>
          <p className="px-8 text-center text-sm text-muted-foreground">
            已有账号？{' '}
            <Link
              href="/login"
              className="underline underline-offset-4 hover:text-primary"
            >
              立即登录
            </Link>
          </p>
        </div>
      </div>
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: 'url(/images/auth-bg-2.jpg)',
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
              "每一个加入FreshBox的用户，都是环保事业的践行者。让我们一起为地球的未来贡献力量。"
            </p>
            <footer className="text-sm">环保倡议者 李明</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
} 