import { envConfig } from '../config/env.loader';

export const endpoints = {
  orangehrm: {
    LOGIN: '/web/index.php/auth/login',
    DASHBOARD: '/web/index.php/dashboard/index',
    PIM_LIST: '/web/index.php/pim/viewEmployeeList',
    LOGOUT: '/web/index.php/auth/logout',
  },
  reqres: {
    USERS: `${envConfig.api.baseUrl}/api/users`,
    USER_BY_ID: (id: string | number): string => `${envConfig.api.baseUrl}/api/users/${id}`,
    LOGIN: `${envConfig.api.baseUrl}/api/login`,
    REGISTER: `${envConfig.api.baseUrl}/api/register`,
  },
} as const;
