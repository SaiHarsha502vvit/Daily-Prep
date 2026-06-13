export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ESS = 'ess',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TERMINATED = 'terminated',
}

export interface UserData {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
}