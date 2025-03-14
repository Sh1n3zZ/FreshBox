import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import type { AuthOptions, Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

// 使用一个稳定的密钥，在生产环境中应该使用环境变量
const secret = process.env.NEXTAUTH_SECRET || "这是一个临时密钥，生产环境中请使用环境变量设置";

export const authOptions: AuthOptions = {
  debug: true, // 启用 NextAuth 的调试模式
  secret, // 添加密钥
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        accessToken: { type: "text" },
        refreshToken: { type: "text" },
        user: { type: "text" },
      },
      async authorize(credentials) {
        console.log("[NextAuth] authorize - 收到的凭证:", {
          accessToken: credentials?.accessToken ? `${credentials.accessToken.substring(0, 20)}...` : null,
          refreshToken: credentials?.refreshToken ? `${credentials.refreshToken.substring(0, 20)}...` : null,
          user: credentials?.user,
        });

        if (!credentials?.accessToken || !credentials?.refreshToken) {
          console.log("[NextAuth] authorize - 凭证缺失，返回 null");
          return null;
        }

        // 解析 user 参数（如果存在）
        let userData: Record<string, any> = {};
        try {
          if (credentials.user) {
            userData = JSON.parse(credentials.user);
            console.log("[NextAuth] authorize - 成功解析用户数据:", userData);
          } else {
            console.log("[NextAuth] authorize - 没有提供用户数据");
          }
        } catch (e) {
          console.error("[NextAuth] authorize - 解析用户数据失败:", e);
        }

        const user = {
          id: userData.id || "user-id",
          name: userData.username || "用户",
          email: userData.email || "user@example.com",
          accessToken: credentials.accessToken,
          refreshToken: credentials.refreshToken,
          ...userData,
        };

        console.log("[NextAuth] authorize - 返回的用户:", {
          id: user.id,
          name: user.name,
          email: user.email,
          hasAccessToken: !!user.accessToken,
          hasRefreshToken: !!user.refreshToken,
        });

        return user;
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    // 避免加密错误
    secret,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      console.log("[NextAuth] jwt 回调 - 输入:", {
        hasUser: !!user,
        tokenBefore: token ? {
          ...token,
          accessToken: token.accessToken ? `${String(token.accessToken).substring(0, 20)}...` : null,
          refreshToken: token.refreshToken ? `${String(token.refreshToken).substring(0, 20)}...` : null,
        } : null,
      });

      if (user) {
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        // 添加其他用户属性到token
        if (user.username) token.username = user.username;
        if (user.avatar) token.avatar = user.avatar;
      }

      console.log("[NextAuth] jwt 回调 - 输出:", {
        id: token.id,
        name: token.name,
        email: token.email,
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
      });

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      console.log("[NextAuth] session 回调 - 输入:", {
        sessionBefore: session ? { 
          ...session,
          user: session.user
        } : null,
        tokenInfo: token ? { 
          id: token.id,
          name: token.name,
          email: token.email,
          hasAccessToken: !!token.accessToken,
          hasRefreshToken: !!token.refreshToken,
        } : null,
      });

      if (token) {
        // 添加用户信息到session.user
        session.user = {
          id: token.id as string,
          name: token.name,
          email: token.email,
        };
        
        // 如果有额外属性，也添加到user对象
        if (token.username) (session.user as any).username = token.username;
        if (token.avatar) (session.user as any).avatar = token.avatar;
        
        // 添加token到session
        (session as any).accessToken = token.accessToken;
        (session as any).refreshToken = token.refreshToken;
      }

      console.log("[NextAuth] session 回调 - 输出:", {
        user: session.user,
        hasAccessToken: !!(session as any).accessToken,
        hasRefreshToken: !!(session as any).refreshToken,
        expires: session.expires,
      });

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  logger: {
    error(code, metadata) {
      console.error(`[NextAuth] [错误] ${code}:`, metadata);
    },
    warn(code) {
      console.warn(`[NextAuth] [警告] ${code}`);
    },
    debug(code, metadata) {
      console.log(`[NextAuth] [调试] ${code}:`, metadata);
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
