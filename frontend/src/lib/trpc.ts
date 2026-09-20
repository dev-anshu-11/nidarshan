import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../backend/routes/routers";

export const trpc = createTRPCReact<AppRouter>();
