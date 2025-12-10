import { User } from "@prisma/client";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Request {
      user?: Pick<User, "id" | "email" | "username">;
    }
  }
}

export {};
