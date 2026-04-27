import { Request } from 'express';
export declare const Role: {
    readonly USER: "USER";
    readonly ADMIN: "ADMIN";
    readonly MODERATOR: "MODERATOR";
};
export type Role = typeof Role[keyof typeof Role];
export interface JwtPayload {
    userId: string;
    email: string;
    role: Role;
}
export interface AuthRequest extends Request {
    user?: JwtPayload;
}
//# sourceMappingURL=index.d.ts.map