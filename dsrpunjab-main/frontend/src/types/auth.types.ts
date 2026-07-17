export type UserRole = 
  | 'Super Admin'
  | 'State Admin'
  | 'District Admin'
  | 'Officer 1'
  | 'Officer 2'
  | 'Geologist'
  | 'Reviewer'
  | 'Data Entry Operator'
  | 'Report Generator';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district: string;
}
