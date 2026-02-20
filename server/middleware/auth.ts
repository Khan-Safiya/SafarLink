import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

export const authMiddleware = ClerkExpressRequireAuth({});

// Extend Request type to include auth property if needed in the future
declare global {
  namespace Express {
    interface Request {
      auth: {
        userId: string;
        sessionId: string;
        getToken: () => Promise<string | null>;
      };
    }
  }
}
