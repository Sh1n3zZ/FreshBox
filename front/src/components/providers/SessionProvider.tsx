"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// 创建一个监控组件来打印会话状态变化
function SessionMonitor() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log("[SessionProvider] 会话状态:", {
      status,
      hasSession: !!session,
      user: session?.user,
      hasAccessToken: !!(session as any)?.accessToken,
      expires: session?.expires,
    });

    // 检测会话异常情况
    if (status === 'authenticated' && !session?.user?.id) {
      console.error('[SessionProvider] 异常：会话已验证但缺少用户ID', { 
        user: session?.user,
        accessToken: (session as any)?.accessToken ? '存在' : '不存在',
      });
      
      // 尝试刷新会话
      update().then(() => {
        console.log('[SessionProvider] 刷新会话完成');
      }).catch(error => {
        console.error('[SessionProvider] 刷新会话失败', error);
      });
    }
  }, [session, status, update]);

  return null;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  console.log("[SessionProvider] 初始化");
  
  return (
    <NextAuthSessionProvider refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <SessionMonitor />
      {children}
    </NextAuthSessionProvider>
  );
}
