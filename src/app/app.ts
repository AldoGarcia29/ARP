import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

import { ToastModule } from 'primeng/toast';
import { Navbar } from './shared/navbar/navbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToastModule, Navbar],
  templateUrl: './app.html',
})
export class AppComponent {
  currentUrl = '';

  constructor(private router: Router) {
    this.currentUrl = this.router.url;

    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe(() => {
        this.currentUrl = this.router.url;
      });
  }

  showTopNavbar(): boolean {
  return !(
    this.currentUrl.startsWith('/home') ||
    this.currentUrl.startsWith('/groups') ||
    this.currentUrl.startsWith('/users') ||
    this.currentUrl.startsWith('/group-view')
  );
}
}