import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CheckboxModule } from 'primeng/checkbox';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { AppUser } from '../../models/user.model';
import { UserPermissions } from '../../models/permissions.model';

const USERS_KEY = 'arp_users';
const CURRENT_USER_KEY = 'arp_current_user';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    CheckboxModule,
    ToastModule
  ],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss'],
  providers: [MessageService]
})
export class UserManagement implements OnInit {
  currentUser: AppUser | null = null;
  users: AppUser[] = [];

  dialogVisible = false;
  submitted = false;
  editingUserId: number | null = null;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private msg: MessageService
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', Validators.required],
      password: ['', Validators.required],
      address: ['', Validators.required],
      phone: ['', Validators.required],
      birthDate: ['', Validators.required],

      canCreateGroup: [false],
      canEditGroup: [false],
      canDeleteGroup: [false],
      canAddMembers: [false],
      canRemoveMembers: [false],
      canCreateTickets: [false],
      canEditTickets: [false],
      canViewTicketDetail: [true],
        canManageGroups: [false],
  canManageUsers: [false]
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();

    if (!this.isSuperAdmin) {
      this.router.navigateByUrl('/home');
      return;
    }

    this.loadUsers();
  }

  get isSuperAdmin(): boolean {
    return this.currentUser?.email === 'aldo@gmail.com';
  }

  private loadCurrentUser(): void {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) {
      this.currentUser = null;
      return;
    }

    try {
      this.currentUser = JSON.parse(raw) as AppUser;
    } catch {
      this.currentUser = null;
    }
  }

  private loadUsers(): void {
    const raw = localStorage.getItem(USERS_KEY);

    if (!raw) {
      this.users = [];
      return;
    }

    try {
      this.users = JSON.parse(raw) as AppUser[];
    } catch {
      this.users = [];
    }
  }

  private saveUsers(): void {
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
  }

  openNew(): void {
    this.submitted = false;
    this.editingUserId = null;

    this.form.reset({
      username: '',
      email: '',
      fullName: '',
      password: '',
      address: '',
      phone: '',
      birthDate: '',
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
    });

    this.dialogVisible = true;
  }

  editUser(user: AppUser): void {
    this.submitted = false;
    this.editingUserId = user.id;

    this.form.reset({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      password: user.password,
      address: user.address,
      phone: user.phone,
      birthDate: user.birthDate,
      canCreateGroup: user.permissions.canCreateGroup,
      canEditGroup: user.permissions.canEditGroup,
      canDeleteGroup: user.permissions.canDeleteGroup,
      canAddMembers: user.permissions.canAddMembers,
      canRemoveMembers: user.permissions.canRemoveMembers,
      canCreateTickets: user.permissions.canCreateTickets,
      canEditTickets: user.permissions.canEditTickets,
      canViewTicketDetail: user.permissions.canViewTicketDetail,
        canManageGroups: user.permissions.canManageGroups,
  canManageUsers: user.permissions.canManageUsers
    });

    this.dialogVisible = true;
  }

  saveUser(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Completa el formulario correctamente.'
      });
      return;
    }

    const v = this.form.getRawValue();

    const permissions: UserPermissions = {
      canCreateGroup: v.canCreateGroup,
      canEditGroup: v.canEditGroup,
      canDeleteGroup: v.canDeleteGroup,
      canAddMembers: v.canAddMembers,
      canRemoveMembers: v.canRemoveMembers,
      canCreateTickets: v.canCreateTickets,
      canEditTickets: v.canEditTickets,
      canViewTicketDetail: v.canViewTicketDetail,
        canManageGroups: v.canManageGroups,
  canManageUsers: v.canManageUsers
    };

    if (this.editingUserId === null) {
      const newId = this.users.length ? Math.max(...this.users.map(u => u.id)) + 1 : 1;

      const newUser: AppUser = {
        id: newId,
        username: v.username,
        email: v.email,
        fullName: v.fullName,
        password: v.password,
        address: v.address,
        phone: v.phone,
        birthDate: v.birthDate,
        permissions
      };

      this.users = [newUser, ...this.users];

      this.msg.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Usuario creado correctamente.'
      });
    } else {
      this.users = this.users.map(user =>
        user.id === this.editingUserId
          ? {
              ...user,
              username: v.username,
              email: v.email,
              fullName: v.fullName,
              password: v.password,
              address: v.address,
              phone: v.phone,
              birthDate: v.birthDate,
              permissions
            }
          : user
      );

      this.msg.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Usuario actualizado correctamente.'
      });
    }

    this.saveUsers();

    const rawCurrent = localStorage.getItem(CURRENT_USER_KEY);

    if (rawCurrent) {
      try {
        const current = JSON.parse(rawCurrent) as AppUser;
        const updatedCurrent = this.users.find(u => u.id === current.id);

        if (updatedCurrent) {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
          this.currentUser = updatedCurrent;
          window.dispatchEvent(new Event('arp-user-updated'));
        }
      } catch {
        // nada
      }
    }

    this.dialogVisible = false;
    this.editingUserId = null;
  }

  deleteUser(user: AppUser): void {
    if (user.email === 'aldo@gmail.com') {
      this.msg.add({
        severity: 'warn',
        summary: 'Bloqueado',
        detail: 'No puedes eliminar al superAdmin.'
      });
      return;
    }

    this.users = this.users.filter(u => u.id !== user.id);
    this.saveUsers();

    const rawCurrent = localStorage.getItem(CURRENT_USER_KEY);

    if (rawCurrent) {
      try {
        const current = JSON.parse(rawCurrent) as AppUser;
        const updatedCurrent = this.users.find(u => u.id === current.id);

        if (updatedCurrent) {
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedCurrent));
        }

        window.dispatchEvent(new Event('arp-user-updated'));
      } catch {
        // nada
      }
    }

    this.msg.add({
      severity: 'warn',
      summary: 'Eliminado',
      detail: 'Usuario eliminado.'
    });
  }
}