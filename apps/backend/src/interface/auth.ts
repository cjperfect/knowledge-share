import type { Request } from 'express';

export type AdminRole = 'super_admin' | 'admin';
export type AdminStatus = 'active' | 'disabled';

export interface AdminSession {
  id: string;
  username: string;
  role: AdminRole;
}

export type AdminRequest = Request & {
  admin?: AdminSession;
};
