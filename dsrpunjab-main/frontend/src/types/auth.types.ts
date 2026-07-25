export type UserRole = 'State Admin' | 'DMO' | 'COE SENSRS' | 'Reviewer' | 'Head Office';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district: string;
}
