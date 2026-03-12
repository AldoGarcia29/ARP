import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { AppUser } from '../../models/user.model';

const USERS_KEY = 'arp_users';
const CURRENT_USER_KEY = 'arp_current_user';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    CommonModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  submitted = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private msg: MessageService,
    private router: Router
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.ensureUsersExist();
  }

  isInvalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }

private ensureUsersExist() {
    const raw = localStorage.getItem(USERS_KEY);
  if (raw) return;
  const demoUsers: AppUser[] = [
    {
      id: 1,
      username: 'aldo',
      email: 'aldo@gmail.com',
      fullName: 'Aldo Jair Garcia Pacheco',
      password: '12345',
      address: 'Avenida de la Luz',
      phone: '4423936181',
      birthDate: '2005-01-29',
      permissions: {
        canCreateGroup: true,
        canEditGroup: true,
        canDeleteGroup: true,
        canAddMembers: true,
        canRemoveMembers: true,
        canCreateTickets: true,
        canEditTickets: true,
        canViewTicketDetail: true,
          canManageGroups: true,
  canManageUsers: true

      }
    },
    {
      id: 2,
      username: 'santiago',
      email: 'santiago@gmail.com',
      fullName: 'Santiago Perez',
      password: '12345',
      address: 'Colonia Centro',
      phone: '4421112233',
      birthDate: '2004-08-14',
      permissions: {
        canCreateGroup: false,
        canEditGroup: false,
        canDeleteGroup: false,
        canAddMembers: false,
        canRemoveMembers: false,
        canCreateTickets: true,
        canEditTickets: false,
        canViewTicketDetail: true,
                  canManageGroups: false,
  canManageUsers: false
      }
    },
    {
      id: 3,
      username: 'fernanda',
      email: 'fernanda@gmail.com',
      fullName: 'Fernanda Lopez',
      password: '12345',
      address: 'Juriquilla',
      phone: '4425556677',
      birthDate: '2003-11-02',
      permissions: {
        canCreateGroup: true,
        canEditGroup: true,
        canDeleteGroup: false,
        canAddMembers: true,
        canRemoveMembers: true,
        canCreateTickets: true,
        canEditTickets: true,
        canViewTicketDetail: true,
                          canManageGroups: false,
  canManageUsers: false
      }
    },
    {
      id: 4,
      username: 'luis',
      email: 'luis@gmail.com',
      fullName: 'Luis Ramirez',
      password: '12345',
      address: 'El Pueblito',
      phone: '4428889999',
      birthDate: '2002-06-21',
      permissions: {
        canCreateGroup: false,
        canEditGroup: false,
        canDeleteGroup: false,
        canAddMembers: false,
        canRemoveMembers: false,
        canCreateTickets: true,
        canEditTickets: false,
        canViewTicketDetail: true,
                          canManageGroups: false,
  canManageUsers: false
      }
    }
  ];

  localStorage.setItem(USERS_KEY, JSON.stringify(demoUsers));

  const rawCurrent = localStorage.getItem(CURRENT_USER_KEY);

  if (rawCurrent) {
    try {
      const current = JSON.parse(rawCurrent) as AppUser;
      const updatedCurrent = demoUsers.find(u => u.id === current.id);

      if (updatedCurrent) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
      }
    } catch {
      // nada
    }
  }
}
  private getUsers(): AppUser[] {
    const raw = localStorage.getItem(USERS_KEY);

    if (!raw) return [];

    try {
      return JSON.parse(raw) as AppUser[];
    } catch {
      return [];
    }
  }

  login() {
    this.submitted = true;

    if (this.form.invalid) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Completa los campos correctamente.'
      });
      return;
    }

    const email = this.form.value.email!;
    const password = this.form.value.password!;

    const users = this.getUsers();

    const userValid = users.find(
      u => u.email === email && u.password === password
    );

    if (userValid) {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userValid));

      this.msg.add({
        severity: 'success',
        summary: 'Login correcto',
        detail: 'Bienvenido'
      });

      this.router.navigateByUrl('/home');
    } else {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem(CURRENT_USER_KEY);

      this.msg.add({
        severity: 'error',
        summary: 'Credenciales inválidas',
        detail: 'Correo o contraseña incorrectos.'
      });
    }
  }
}