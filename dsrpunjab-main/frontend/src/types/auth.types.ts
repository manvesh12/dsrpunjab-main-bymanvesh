export type UserRole = 'State Admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district: string;
}
