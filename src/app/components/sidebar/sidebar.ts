import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { HasPermissionDirective } from '../../directives/has-permission.directive';


const CURRENT_USER_KEY = 'arp_current_user';
const CURRENT_PERMISSIONS_KEY = 'arp_current_permissions';
const TOKEN_KEY = 'arp_token';
const GLOBAL_PERMISSIONS_KEY = 'arp_global_permissions';
const GROUP_PERMISSIONS_KEY = 'arp_group_permissions';
const IS_LOGGED_IN_KEY = 'isLoggedIn';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule,     HasPermissionDirective],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class Sidebar {
  constructor(private router: Router) {}

  appName = 'ARP';
  version = 'v1.2.8';

  get currentUser(): any {
    const raw = localStorage.getItem(CURRENT_USER_KEY);

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  get permissions(): string[] {
    const raw = localStorage.getItem(CURRENT_PERMISSIONS_KEY);

    if (!raw) return [];

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  get globalPermissions(): string[] {
    const raw = localStorage.getItem(GLOBAL_PERMISSIONS_KEY);

    if (!raw) return [];

    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  get canManageUsers(): boolean {
    return this.permissions.includes('user:manage');
  }

  get canManageGroups(): boolean {
    return this.permissions.includes('group:add') || this.permissions.includes('group:manage');
  }

  get canViewProfile(): boolean {
    return !!this.currentUser;
  }

  logout() {
    localStorage.removeItem(IS_LOGGED_IN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(CURRENT_PERMISSIONS_KEY);
    localStorage.removeItem(GLOBAL_PERMISSIONS_KEY);
    localStorage.removeItem(GROUP_PERMISSIONS_KEY);

    this.router.navigateByUrl('/login');
  }
}