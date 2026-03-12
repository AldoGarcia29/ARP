import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';

import { MessageService, ConfirmationService } from 'primeng/api';
import { AppUser } from '../../models/user.model';

type Level = 'Beginner' | 'Intermediate' | 'Advanced';

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
  history: {
    date: string;
    action: string;
    detail: string;
    user: string;
  }[];
};

type GroupModel = {
  id: number;
  level: Level;
  author: string;
  name: string;
  description: string;
  memberIds: number[];
};

const GROUPS_KEY = 'arp_groups';
const USERS_KEY = 'arp_users';
const TICKETS_KEY = 'arp_tickets';
const CURRENT_USER_KEY = 'arp_current_user';

@Component({
  selector: 'app-groups-page',
  standalone: true,
  templateUrl: './group.html',
  styleUrls: ['./group.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    TagModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
    RouterLink,
    FormsModule
  ],
  providers: [MessageService, ConfirmationService]
})
export class Group implements OnInit, OnDestroy {
  currentUser: AppUser | null = null;

  groups: GroupModel[] = [];
  users: AppUser[] = [];
  tickets: Ticket[] = [];

  selectedUserId: number | null = null;

  levels = [
    { label: 'Beginner', value: 'Beginner' as const },
    { label: 'Intermediate', value: 'Intermediate' as const },
    { label: 'Advanced', value: 'Advanced' as const }
  ];

  dialogVisible = false;
  submitted = false;
  editingId: number | null = null;

  form: FormGroup;

  private onUserUpdated = () => {
    this.loadCurrentUser();
    this.loadUsers();
  };

  constructor(
    private fb: FormBuilder,
    private msg: MessageService,
    private confirm: ConfirmationService
  ) {
    this.form = this.fb.group({
      level: ['Beginner', Validators.required],
      author: ['', Validators.required],
      name: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    this.seedCurrentUserIfNeeded();
    this.loadCurrentUser();
    this.seedGroupsIfNeeded();
    this.loadTickets();
    this.loadGroups();

    window.addEventListener('arp-user-updated', this.onUserUpdated);

    console.log('currentUser:', this.currentUser);
    console.log('groups:', this.groups);
    console.log('visibleGroups:', this.visibleGroups);
    console.log('canCreateGroups:', this.canCreateGroups);
  }

  ngOnDestroy(): void {
    window.removeEventListener('arp-user-updated', this.onUserUpdated);
  }

  private seedCurrentUserIfNeeded(): void {
    const rawCurrentUser = localStorage.getItem(CURRENT_USER_KEY);
    if (rawCurrentUser) return;

    const rawUsers = localStorage.getItem(USERS_KEY);
    if (!rawUsers) return;

    try {
      const parsedUsers = JSON.parse(rawUsers) as AppUser[];

      if (Array.isArray(parsedUsers) && parsedUsers.length > 0) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(parsedUsers[0]));
      }
    } catch {
      // no hacer nada
    }
  }

  private seedGroupsIfNeeded(): void {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (raw) return;

    const defaultGroups: GroupModel[] = [
      {
        id: 1,
        level: 'Beginner',
        author: 'Aldo Jair Garcia Pacheco',
        name: 'ARP Starter',
        description: 'Grupo de práctica inicial.',
        memberIds: [1, 2]
      },
      {
        id: 2,
        level: 'Advanced',
        author: 'Fernanda López',
        name: 'ARP Advanced',
        description: 'Seguimiento avanzado de tickets y métricas.',
        memberIds: [3, 4]
      }
    ];

    localStorage.setItem(GROUPS_KEY, JSON.stringify(defaultGroups));
  }

  private loadCurrentUser(): void {
    const raw = localStorage.getItem(CURRENT_USER_KEY);

    if (!raw) {
      this.currentUser = null;
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AppUser;
      this.currentUser = parsed && typeof parsed.id === 'number' ? parsed : null;
    } catch {
      this.currentUser = null;
    }
  }

  private loadGroups(): void {
    const raw = localStorage.getItem(GROUPS_KEY);

    if (!raw) {
      this.groups = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw) as GroupModel[];
      this.groups = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.groups = [];
    }
  }

  private saveGroups(): void {
    localStorage.setItem(GROUPS_KEY, JSON.stringify(this.groups));
  }

  private loadUsers(): void {
    const raw = localStorage.getItem(USERS_KEY);

    if (!raw) {
      this.users = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw) as AppUser[];
      this.users = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.users = [];
    }
  }

  private loadTickets(): void {
    const raw = localStorage.getItem(TICKETS_KEY);

    if (!raw) {
      this.tickets = [];
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Ticket[];
      this.tickets = Array.isArray(parsed) ? parsed : [];
    } catch {
      this.tickets = [];
    }
  }

  get isLoggedIn(): boolean {
    return !!this.currentUser;
  }

  get canCreateGroups(): boolean {
    return !!this.currentUser?.permissions?.canCreateGroup;
  }

  canEditGroupPermission(group: GroupModel | undefined): boolean {
    if (!group || !this.currentUser) return false;
    return !!this.currentUser.permissions?.canEditGroup;
  }

  canDeleteGroupPermission(group: GroupModel | undefined): boolean {
    if (!group || !this.currentUser) return false;
    return !!this.currentUser.permissions?.canDeleteGroup;
  }

  canAddMembersPermission(group: GroupModel | undefined): boolean {
    if (!group || !this.currentUser) return false;
    return !!this.currentUser.permissions?.canAddMembers;
  }

  canRemoveMembersPermission(group: GroupModel | undefined): boolean {
    if (!group || !this.currentUser) return false;
    return !!this.currentUser.permissions?.canRemoveMembers;
  }

  get canEditCurrentGroupMembers(): boolean {
    return !!this.editingGroup && (
      this.canAddMembersPermission(this.editingGroup) ||
      this.canRemoveMembersPermission(this.editingGroup)
    );
  }

  get visibleGroups(): GroupModel[] {
    if (!this.currentUser?.id) return [];

    return this.groups.filter(group =>
      Array.isArray(group.memberIds) && group.memberIds.includes(this.currentUser!.id)
    );
  }

  get total(): number {
    return this.visibleGroups.length;
  }

  levelSeverity(level: Level): 'success' | 'warn' | 'danger' {
    if (level === 'Advanced') return 'danger';
    if (level === 'Intermediate') return 'warn';
    return 'success';
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }

  get editingGroup(): GroupModel | undefined {
    return this.groups.find(g => g.id === this.editingId);
  }

  get currentMemberIds(): number[] {
    return this.editingGroup?.memberIds ?? [];
  }

  get currentMembers(): AppUser[] {
    return this.users.filter(user => this.currentMemberIds.includes(user.id));
  }

  get availableUsers(): AppUser[] {
    const usedIds = new Set(this.currentMemberIds);
    return this.users.filter(user => !usedIds.has(user.id));
  }

  getMembersCount(group: GroupModel): number {
    return group.memberIds.length;
  }

  getTicketsCount(group: GroupModel): number {
    return this.tickets.filter(ticket => ticket.groupId === group.id).length;
  }

  showNoPermission(action: string): void {
    this.msg.add({
      severity: 'warn',
      summary: 'Sin permiso',
      detail: `No tienes permiso para ${action}.`
    });
  }

  openNew(): void {
    if (!this.isLoggedIn || !this.canCreateGroups) {
      this.showNoPermission('crear grupos');
      return;
    }

    this.submitted = false;
    this.editingId = null;
    this.selectedUserId = null;

    this.form.reset({
      level: 'Beginner',
      author: this.currentUser?.username || this.currentUser?.fullName || '',
      name: '',
      description: ''
    });

    this.dialogVisible = true;
  }

  editGroup(g: GroupModel): void {
    if (!this.canEditGroupPermission(g)) {
      this.showNoPermission('editar este grupo');
      return;
    }

    this.submitted = false;
    this.editingId = g.id;
    this.selectedUserId = null;

    this.form.setValue({
      level: g.level,
      author: g.author,
      name: g.name,
      description: g.description
    });

    this.dialogVisible = true;
  }

  addMember(): void {
    if (!this.canAddMembersPermission(this.editingGroup)) {
      this.showNoPermission('agregar usuarios a este grupo');
      return;
    }

    if (this.editingId === null || this.selectedUserId === null) return;

    const userId = this.selectedUserId;

    this.groups = this.groups.map(group => {
      if (group.id !== this.editingId) return group;
      if (group.memberIds.includes(userId)) return group;

      return {
        ...group,
        memberIds: [...group.memberIds, userId]
      };
    });

    this.saveGroups();
    this.selectedUserId = null;

    this.msg.add({
      severity: 'success',
      summary: 'Agregado',
      detail: 'Usuario agregado al grupo.'
    });
  }

  removeMember(userId: number): void {
    if (!this.canRemoveMembersPermission(this.editingGroup)) {
      this.showNoPermission('eliminar usuarios de este grupo');
      return;
    }

    if (this.editingId === null) return;

    this.groups = this.groups.map(group => {
      if (group.id !== this.editingId) return group;

      return {
        ...group,
        memberIds: group.memberIds.filter(id => id !== userId)
      };
    });

    this.saveGroups();

    this.msg.add({
      severity: 'warn',
      summary: 'Eliminado',
      detail: 'Miembro eliminado del grupo.'
    });
  }

  save(): void {
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

    if (this.editingId === null) {
      if (!this.isLoggedIn || !this.canCreateGroups) {
        this.showNoPermission('crear grupos');
        return;
      }

      const newId = this.groups.length ? Math.max(...this.groups.map(x => x.id)) + 1 : 1;
      const creatorId = this.currentUser?.id ? [this.currentUser.id] : [];

      const created: GroupModel = {
        id: newId,
        level: v.level,
        author: this.currentUser?.username || this.currentUser?.fullName || v.author,
        name: v.name,
        description: v.description,
        memberIds: creatorId
      };

      this.groups = [created, ...this.groups];

      this.msg.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Group creado.'
      });
    } else {
      const targetGroup = this.groups.find(g => g.id === this.editingId);

      if (!this.canEditGroupPermission(targetGroup)) {
        this.showNoPermission('editar este grupo');
        return;
      }

      this.groups = this.groups.map(g =>
        g.id === this.editingId
          ? {
              ...g,
              level: v.level,
              author: g.author,
              name: v.name,
              description: v.description
            }
          : g
      );

      this.msg.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Group actualizado.'
      });
    }

    this.saveGroups();
    this.dialogVisible = false;
  }

  deleteGroup(g: GroupModel): void {
    if (!this.canDeleteGroupPermission(g)) {
      this.showNoPermission('eliminar este grupo');
      return;
    }

    this.confirm.confirm({
      header: 'Confirmar',
      message: `¿Eliminar el group "${g.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, eliminar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.groups = this.groups.filter(x => x.id !== g.id);
        this.saveGroups();

        this.msg.add({
          severity: 'warn',
          summary: 'Eliminado',
          detail: 'Group eliminado.'
        });
      }
    });
  }

  onDialogHide(): void {
    this.submitted = false;
    this.editingId = null;
    this.selectedUserId = null;
  }
}