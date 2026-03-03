import { Routes } from '@angular/router';

import { Landing } from './pages/landing/landing';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Home } from './pages/home/home';
import { MainLayout } from './Layout/main-layout/main-layout';
import { Group } from './pages/group/group';
import { Users } from './pages/users/users';
export const routes: Routes = [
  { path: '', component: Landing},
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  {
    path: '',
    component: MainLayout,
    children: [
      { path: 'home', component: Home },
      { path: 'groups', component: Group },
      { path: 'users', component: Users },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: 'login' },


];