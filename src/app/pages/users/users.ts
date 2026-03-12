import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AppUser } from '../../models/user.model';

type Ticket = {
  id: number;
  title: string;
  description: string;
  status: 'Pendiente' | 'En progreso' | 'Revisión' | 'Finalizado';
  assignedTo: string;
  priority: 'Baja' | 'Media' | 'Alta';
  createdAt: string;
  dueDate: string;
  comments: string[];
  groupId: number;
};

const USERS_KEY = 'arp_users';
const CURRENT_USER_KEY = 'arp_current_user';
const TICKETS_KEY = 'arp_tickets';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    DividerModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './users.html',
  styleUrls: ['./users.scss'],
})
export class Users implements OnInit {
  submitted = false;
  editing = false;

  users: AppUser[] = [];
  currentUser: AppUser | null = null;
  tickets: Ticket[] = [];

  profile: AppUser = {
    id: 0,
    username: '',
    email: '',
    fullName: '',
    password: '',
    address: '',
    phone: '',
    birthDate: '',
    permissions: {
      canCreateGroup: false,
      canEditGroup: false,
      canDeleteGroup: false,
      canAddMembers: false,
      canRemoveMembers: false,
      canCreateTickets: false,
      canEditTickets: false,
      canViewTicketDetail: true,
                                canManageGroups: false,
  canManageUsers: false
    }
  };

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private msg: MessageService
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      fullName: ['', Validators.required],
      address: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      birthDate: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadCurrentUser();
    this.loadTickets();

    if (this.currentUser) {
      const fullUser = this.users.find(u => u.id === this.currentUser!.id);

      if (fullUser) {
        this.currentUser = { ...fullUser };
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(this.currentUser));
      }

      this.profile = { ...this.currentUser };
      this.form.patchValue(this.profile);
    }

    this.form.disable();
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

  private loadTickets(): void {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (!raw) {
      this.tickets = [];
      return;
    }

    try {
      this.tickets = JSON.parse(raw) as Ticket[];
    } catch {
      this.tickets = [];
    }
  }

  get assignedTickets(): Ticket[] {
    if (!this.currentUser) return [];

    const currentNames = [
      this.currentUser.username?.trim().toLowerCase(),
      this.currentUser.fullName?.split(' ')[0]?.trim().toLowerCase(),
      this.currentUser.fullName?.trim().toLowerCase()
    ].filter(Boolean);

    return this.tickets.filter(ticket =>
      currentNames.includes(ticket.assignedTo.trim().toLowerCase())
    );
  }

  get openTicketsCount(): number {
    return this.assignedTickets.filter(t => t.status === 'Pendiente').length;
  }

  get inProgressTicketsCount(): number {
    return this.assignedTickets.filter(t => t.status === 'En progreso').length;
  }

  get doneTicketsCount(): number {
    return this.assignedTickets.filter(t => t.status === 'Finalizado').length;
  }

  get reviewTicketsCount(): number {
    return this.assignedTickets.filter(t => t.status === 'Revisión').length;
  }

  get totalAssignedTicketsCount(): number {
    return this.assignedTickets.length;
  }

  startEdit(): void {
    this.editing = true;
    this.submitted = false;
    this.form.enable();
  }

  cancelEdit(): void {
    this.editing = false;
    this.submitted = false;
    this.form.patchValue(this.profile);
    this.form.disable();
  }

  saveChanges(): void {
    this.submitted = true;

    if (this.form.invalid || !this.currentUser) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Completa los campos correctamente.',
      });
      return;
    }

    const updatedForm = this.form.getRawValue();

    const updatedProfile: AppUser = {
      ...this.currentUser,
      ...updatedForm
    };

    this.users = this.users.map(user =>
      user.id === updatedProfile.id ? updatedProfile : user
    );

    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedProfile));

    this.currentUser = updatedProfile;
    this.profile = updatedProfile;

    this.msg.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Perfil actualizado.',
    });

    this.editing = false;
    this.form.disable();
  }

  deleteProfile(): void {
    if (!this.currentUser) return;

    this.users = this.users.filter(user => user.id !== this.currentUser!.id);
    localStorage.setItem(USERS_KEY, JSON.stringify(this.users));
    localStorage.removeItem(CURRENT_USER_KEY);

    this.currentUser = null;
    this.profile = {
      id: 0,
      username: '',
      email: '',
      fullName: '',
      password: '',
      address: '',
      phone: '',
      birthDate: '',
      permissions: {
        canCreateGroup: false,
        canEditGroup: false,
        canDeleteGroup: false,
        canAddMembers: false,
        canRemoveMembers: false,
        canCreateTickets: false,
        canEditTickets: false,
        canViewTicketDetail: true,
                                  canManageGroups: false,
  canManageUsers: false
      }
    };

    this.form.reset(this.profile);
    this.form.disable();
    this.editing = false;

    this.msg.add({
      severity: 'warn',
      summary: 'Eliminado',
      detail: 'Perfil eliminado.',
    });
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }
}