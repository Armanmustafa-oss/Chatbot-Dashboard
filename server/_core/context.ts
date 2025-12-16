import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { getUserFromToken } from "../auth-local";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function parseCookies(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }
  const parsed = parseCookieHeader(cookieHeader);
  return new Map(Object.entries(parsed));
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Try local authentication first
    const cookies = parseCookies(opts.req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    
    if (sessionCookie) {
      const localUser = getUserFromToken(sessionCookie);
      if (localUser) {
        // Convert local user to User type (simplified)
        user = {
          id: localUser.id,
          openId: localUser.id,
          name: localUser.name || localUser.username,
          email: localUser.email || null,
          loginMethod: "local",
          lastSignedIn: new Date(),
          createdAt: localUser.createdAt,
        } as User;
        return {
          req: opts.req,
          res: opts.res,
          user,
        };
      }
    }
    
    // Fall back to OAuth authentication
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
