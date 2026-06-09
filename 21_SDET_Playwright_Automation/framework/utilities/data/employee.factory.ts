import { uniqueId } from './data.loader';

export enum EmploymentStatus {
  FULL_TIME = 'Full-Time Contract',
  PART_TIME = 'Part-Time Contract',
  FREELANCE = 'Freelance',
  INTERNSHIP = 'Internship',
}

export interface EmployeeData {
  firstName: string;
  middleName: string;
  lastName: string;
  employeeId: string;
  email: string;
  jobTitle: string;
  employmentStatus: EmploymentStatus;
}

export interface EmployeeUpdateData {
  nationality?: string;
  maritalStatus?: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: 'Male' | 'Female';
}

export function generateEmployeeData(overrides: Partial<EmployeeData> = {}): EmployeeData {
  const timestamp = Date.now();
  const id = uniqueId('EMP');
  return {
    firstName: overrides.firstName ?? `Test${timestamp}`,
    middleName: overrides.middleName ?? 'M',
    lastName: overrides.lastName ?? `User${Math.floor(Math.random() * 10000)}`,
    employeeId: overrides.employeeId ?? id,
    email: overrides.email ?? `test.${timestamp}@example.com`,
    jobTitle: overrides.jobTitle ?? 'Software Engineer',
    employmentStatus: overrides.employmentStatus ?? EmploymentStatus.FULL_TIME,
  };
}

export function generateEmployeeUpdateData(
  overrides: Partial<EmployeeUpdateData> = {}
): EmployeeUpdateData {
  return {
    nationality: overrides.nationality ?? 'American',
    maritalStatus: overrides.maritalStatus ?? 'Single',
    dateOfBirth: overrides.dateOfBirth ?? '1990-01-01',
    gender: overrides.gender ?? 'Male',
  };
}
