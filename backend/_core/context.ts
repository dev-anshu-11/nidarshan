import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../drizzle/schema";
import { sdk } from "./sdk";
import { ENV } from "./env";

const DEMO_MODE = process.env.DEMO_MODE === "true" || !ENV.oAuthServerUrl;

const DEMO_USER: User = {
  id: 1,
  openId: "demo-investigator",
  name: "Investigator",
  email: "demo@nidarshan.app",
  loginMethod: "demo",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  if (DEMO_MODE) {
    user = DEMO_USER;
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
