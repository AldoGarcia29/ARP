import { UserPermissions } from './permissions.model';

export interface AppUser {
  id: number;
  username: string;
  email: string;
  fullName: string;
  password: string;
  address: string;
  phone: string;
  birthDate: string;
  permissions: UserPermissions;
}