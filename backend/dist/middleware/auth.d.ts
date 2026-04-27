import { Response, NextFunction } from 'express';
import { AuthRequest, JwtPayload } from '../types';
export declare function signToken(payload: JwtPayload): string;
export declare function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void;
export declare function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map