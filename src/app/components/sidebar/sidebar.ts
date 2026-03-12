import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, ButtonModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class Sidebar {
  constructor(private router: Router) {}

  appName = 'ARP';
  version = 'v1.0.0';

  get currentUser(): any {
    const raw = localStorage.getItem('arp_current_user');

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

get canManageGroups(): boolean {
  return !!this.currentUser?.permissions?.canManageGroups;
}

get canManageUsers(): boolean {
  return !!this.currentUser?.permissions?.canManageUsers;
}

  logout() {
    localStorage.removeItem('arp_current_user');
    localStorage.removeItem('isLoggedIn');
    this.router.navigateByUrl('/login');
  }
}