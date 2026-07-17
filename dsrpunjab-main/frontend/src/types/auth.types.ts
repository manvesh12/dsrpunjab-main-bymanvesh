export type UserRole = 
  | 'Super Admin'
  | 'State Admin'
  | 'District Admin'
  | 'Survey Lead'
  | 'Field Surveyor'
  | 'Data Entry'
  | 'GIS Expert'
  | 'Geologist'
  | 'Environment'
  | 'Reviewer'
  | 'Approver'
  | 'Auditor';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  district: string;
}
