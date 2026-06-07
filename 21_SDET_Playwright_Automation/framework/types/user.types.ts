export enum UserRole {
  ADMIN = 'ADMIN',
  ESS = 'ESS',
  AUDITOR = 'AUDITOR',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  DISABLED = 'DISABLED',
  LOCKED = 'LOCKED',
}

export interface UserData {
  username: string;
  password: string;
  role: UserRole;
  status?: UserStatus;
  employeeId?: string;
}

export interface PooledAccount extends UserData {
  id: number;
}
