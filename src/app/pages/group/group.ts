import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormsModule
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';
import { SelectModule } from 'primeng/select';

import { MessageService, ConfirmationService } from 'primeng/api';

import {
  GroupService,
  GroupUser
} from '../../services/group.service';
import { UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';

import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { HasGroupPermissionDirective } from '../../directives/has-group-permission.directive';


const CURRENT_USER_KEY = 'arp_current_user';
const CURRENT_PERMISSIONS_KEY = 'arp_current_permissions';
const GLOBAL_PERMISSIONS_KEY = 'arp_global_permissions';
const GROUP_PERMISSIONS_KEY = 'arp_group_permissions';

interface UiGroup {
  id: string;
  name: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  author: string;
  creatorId: string;
  description: string;
  members: GroupUser[];
  ticketsCount: number;
}

interface UiMember {
  id: string;
  username: string;
  email: string;
  fullName: string;
}

interface UserOption {
  id: string;
  username: string;
  email: string;
  fullName: string;
}

@Component({
  selector: 'app-group',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink,
    CardModule,
    TagModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
    SelectModule,
      HasPermissionDirective,
      HasGroupPermissionDirective
  ],
  providers: [MessageService, ConfirmationService],
  templateUrl: './group.html',
  styleUrl: './group.scss'
})
export class Group implements OnInit {
  private fb = inject(FormBuilder);
  private groupService = inject(GroupService);
  private http = inject(HttpClient);
  private userService = inject(UserService);
  private msg = inject(MessageService);
  private confirm = inject(ConfirmationService);

  form: FormGroup = this.fb.group({
    level: ['Beginner', Validators.required],
    author: ['', Validators.required],
    name: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  groups: UiGroup[] = [];
  visibleGroups: UiGroup[] = [];
  total = 0;

  dialogVisible = false;
  editingId: string | null = null;

  levels = [
    { label: 'Beginner', value: 'Beginner' },
    { label: 'Intermediate', value: 'Intermediate' },
    { label: 'Advanced', value: 'Advanced' }
  ];

  availableUsers: UserOption[] = [];
  selectedUserId: string | null = null;
  currentMembers: UiMember[] = [];

  canCreateGroups = false;
  canEditCurrentGroupMembers = false;

  currentUserId: string | null = null;
  currentUsername = '';
  currentFullName = '';

  permissions: string[] = [];
  globalPermissions: string[] = [];
  groupPermissionsRaw: Array<{
    grupo_id?: string;
    groupId?: string;
    permissions: string[];
  }> = [];

  ngOnInit(): void {
    this.loadAuthData();
    this.resolvePermissions();
    this.loadGroups();
    this.loadUsers();
  }

  private loadAuthData(): void {
    const rawUser = localStorage.getItem(CURRENT_USER_KEY);
    const rawPermissions = localStorage.getItem(CURRENT_PERMISSIONS_KEY);
    const rawGlobalPermissions = localStorage.getItem(GLOBAL_PERMISSIONS_KEY);
    const rawGroupPermissions = localStorage.getItem(GROUP_PERMISSIONS_KEY);

    if (rawUser) {
      try {
        const user = JSON.parse(rawUser);
        this.currentUserId = user?.id ?? null;
        this.currentUsername = user?.username ?? '';
        this.currentFullName =
          user?.nombre_completo ?? user?.fullName ?? user?.username ?? '';
      } catch {
        this.currentUserId = null;
        this.currentUsername = '';
        this.currentFullName = '';
      }
    }

    if (rawPermissions) {
      try {
        this.permissions = JSON.parse(rawPermissions) || [];
      } catch {
        this.permissions = [];
      }
    }

    if (rawGlobalPermissions) {
      try {
        this.globalPermissions = JSON.parse(rawGlobalPermissions) || [];
      } catch {
        this.globalPermissions = [];
      }
    }

    if (rawGroupPermissions) {
      try {
        this.groupPermissionsRaw = JSON.parse(rawGroupPermissions) || [];
      } catch {
        this.groupPermissionsRaw = [];
      }
    }
  }

  private resolvePermissions(): void {
    this.canCreateGroups = this.hasAnyPermission([
      'group:add',
      'group:create',
      'group:manage'
    ]);
  }

  private loadGroups(): void {
    this.groupService.getAll().subscribe({
      next: (resp) => {
        const list = this.extractArray(resp?.data);
        this.groups = list.map((g: any) => this.mapGroup(g));
        this.visibleGroups = [...this.groups];
        this.total = this.groups.length;
      },
      error: () => {
        this.groups = [];
        this.visibleGroups = [];
        this.total = 0;

        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los grupos.'
        });
      }
    });
  }

  private loadUsers(): void {
    this.http.get<any>(`${environment.auth}`).subscribe({
      next: (resp) => {
        const list = this.extractArray(resp?.data);
        this.availableUsers = list.map((u: any) => ({
          id: u.id,
          username: u.username ?? '',
          email: u.email ?? '',
          fullName: u.nombre_completo ?? u.fullName ?? u.username ?? ''
        }));
      },
      error: () => {
        this.availableUsers = [];
      }
    });
  }

  private extractArray(data: any): any[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.groups)) return data.groups;
    if (Array.isArray(data?.rows)) return data.rows;
    return [];
  }

  private mapGroup(g: any): UiGroup {
    return {
      id: g.id,
      name: g.nombre ?? g.name ?? '',
      level: g.nivel ?? g.level ?? 'Beginner',
      author: g.autor ?? g.author ?? '',
      creatorId: g.creador_id ?? g.creatorId ?? '',
      description: g.descripcion ?? g.description ?? '',
      members: Array.isArray(g.members) ? g.members : [],
      ticketsCount: Number(g.ticketsCount ?? g.tickets_count ?? 0)
    };
  }

  levelSeverity(level: string): 'success' | 'warn' | 'danger' | 'info' | 'secondary' | 'contrast' {
    switch (level) {
      case 'Beginner':
        return 'success';
      case 'Intermediate':
        return 'warn';
      case 'Advanced':
        return 'danger';
      default:
        return 'info';
    }
  }

  getMembersCount(group: UiGroup): number {
    return group.members?.length ?? 0;
  }

  getTicketsCount(group: UiGroup): number {
    return Number(group.ticketsCount ?? 0);
  }

  openNew(): void {
    if (!this.canCreateGroups) {
      this.msg.add({
        severity: 'warn',
        summary: 'Sin permiso',
        detail: 'No tienes permiso para crear grupos.'
      });
      return;
    }

    this.editingId = null;
    this.selectedUserId = null;
    this.currentMembers = [];
    this.canEditCurrentGroupMembers = false;

    this.form.reset({
      level: 'Beginner',
      author: this.currentFullName || this.currentUsername || '',
      name: '',
      description: ''
    });

    this.dialogVisible = true;
  }

  editGroup(group: UiGroup): void {
    if (!this.canEditGroupPermission(group)) {
      this.msg.add({
        severity: 'warn',
        summary: 'Sin permiso',
        detail: 'No tienes permiso para editar este grupo.'
      });
      return;
    }

    this.editingId = group.id;
    this.selectedUserId = null;

    this.form.patchValue({
      level: group.level,
      author: group.author,
      name: group.name,
      description: group.description
    });

    this.currentMembers = (group.members ?? []).map((m) => ({
      id: m.id,
      username: m.username,
      email: m.email,
      fullName: m.nombre_completo
    }));

    this.canEditCurrentGroupMembers = this.canManageMembers(group);
    this.dialogVisible = true;
  }

  save(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      this.msg.add({
        severity: 'warn',
        summary: 'Formulario inválido',
        detail: 'Completa todos los campos correctamente.'
      });
      return;
    }

    const value = this.form.getRawValue();

    if (this.editingId === null) {
      if (!this.canCreateGroups) {
        this.msg.add({
          severity: 'warn',
          summary: 'Sin permiso',
          detail: 'No tienes permiso para crear grupos.'
        });
        return;
      }

      if (!this.currentUserId) {
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se encontró el usuario actual.'
        });
        return;
      }

      this.groupService.create({
        nivel: value.level,
        creador_id: this.currentUserId,
        nombre: value.name,
        descripcion: value.description
      }).subscribe({
        next: () => {
          this.msg.add({
            severity: 'success',
            summary: 'Correcto',
            detail: 'Grupo creado correctamente.'
          });
          this.dialogVisible = false;
          this.loadGroups();
        },
        error: () => {
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el grupo.'
          });
        }
      });

      return;
    }

    const group = this.groups.find(g => g.id === this.editingId);
    if (!group) return;

    if (!this.canEditGroupPermission(group)) {
      this.msg.add({
        severity: 'warn',
        summary: 'Sin permiso',
        detail: 'No tienes permiso para editar este grupo.'
      });
      return;
    }

    this.groupService.update(this.editingId, {
      nivel: value.level,
      nombre: value.name,
      descripcion: value.description
    }).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Correcto',
          detail: 'Grupo actualizado correctamente.'
        });
        this.dialogVisible = false;
        this.loadGroups();
      },
      error: () => {
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el grupo.'
        });
      }
    });
  }

  deleteGroup(group: UiGroup): void {
    if (!this.canDeleteGroupPermission(group)) {
      this.msg.add({
        severity: 'warn',
        summary: 'Sin permiso',
        detail: 'No tienes permiso para borrar este grupo.'
      });
      return;
    }

    this.confirm.confirm({
      header: 'Confirmar',
      message: `¿Seguro que deseas eliminar el grupo "${group.name}"?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, borrar',
      rejectLabel: 'Cancelar',
      accept: () => {
        this.groupService.delete(group.id).subscribe({
          next: () => {
            this.msg.add({
              severity: 'success',
              summary: 'Correcto',
              detail: 'Grupo eliminado correctamente.'
            });
            this.loadGroups();
          },
          error: () => {
            this.msg.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo eliminar el grupo.'
            });
          }
        });
      }
    });
  }

  addMember(): void {
    if (!this.editingId || !this.selectedUserId) return;

    const group = this.groups.find(g => g.id === this.editingId);
    if (!group || !this.canAddMembers(group)) {
  this.msg.add({
    severity: 'warn',
    summary: 'Sin permiso',
    detail: 'No tienes permiso para agregar miembros a este grupo.'
  });
  return;
}

    this.groupService.addMember(this.editingId, this.selectedUserId).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Correcto',
          detail: 'Miembro agregado correctamente.'
        });
        this.selectedUserId = null;
        this.reloadGroupsKeepingDialog();
      },
      error: (err) => {
  console.error('ERROR ADD MEMBER:', err);

  this.msg.add({
    severity: 'error',
    summary: 'Error',
    detail: err?.error?.message || 'No se pudo agregar el miembro.'
  });
}
    });
  }

  removeMember(userId: string): void {
    if (!this.editingId) return;

    const group = this.groups.find(g => g.id === this.editingId);
    if (!group || !this.canRemoveMembers(group)) {
  this.msg.add({
    severity: 'warn',
    summary: 'Sin permiso',
    detail: 'No tienes permiso para quitar miembros de este grupo.'
  });
  return;
}

    this.groupService.removeMember(this.editingId, userId).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Correcto',
          detail: 'Miembro removido correctamente.'
        });
        this.reloadGroupsKeepingDialog();
      },
      error: (err) => {
  console.error('ERROR REMOVE MEMBER:', err);

  this.msg.add({
    severity: 'error',
    summary: 'Error',
    detail: err?.error?.message || 'No se pudo remover el miembro.'
  });
}
    });
  }

  private reloadGroupsKeepingDialog(): void {
    const editingId = this.editingId;

    this.groupService.getAll().subscribe({
      next: (resp) => {
        const list = this.extractArray(resp?.data);
        this.groups = list.map((g: any) => this.mapGroup(g));
        this.visibleGroups = [...this.groups];
        this.total = this.groups.length;

        if (editingId) {
          const updated = this.groups.find(g => g.id === editingId);
          if (updated) {
            this.currentMembers = (updated.members ?? []).map((m) => ({
              id: m.id,
              username: m.username,
              email: m.email,
              fullName: m.nombre_completo
            }));
            this.canEditCurrentGroupMembers = this.canManageMembers(updated);
          }
        }
      },
      error: () => {
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron refrescar los grupos.'
        });
      }
    });
  }

  onDialogHide(): void {
    this.form.reset({
      level: 'Beginner',
      author: this.currentFullName || this.currentUsername || '',
      name: '',
      description: ''
    });

    this.editingId = null;
    this.selectedUserId = null;
    this.currentMembers = [];
    this.canEditCurrentGroupMembers = false;
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  canEditGroupPermission(group: UiGroup): boolean {
    if (this.hasAnyPermission(['group:edit', 'group:update', 'group:manage'])) {
      return true;
    }

    if (this.currentUserId && group.creatorId === this.currentUserId) {
      return true;
    }

    return this.hasGroupScopedPermission(group.id, [
      'group:edit',
      'group:update',
      'group:manage'
    ]);
  }

  canDeleteGroupPermission(group: UiGroup): boolean {
    if (this.hasAnyPermission(['group:delete', 'group:manage'])) {
      return true;
    }

    if (this.currentUserId && group.creatorId === this.currentUserId) {
      return true;
    }

    return this.hasGroupScopedPermission(group.id, [
      'group:delete',
      'group:manage'
    ]);
  }

  private canAddMembers(group: UiGroup): boolean {
  if (this.hasAnyPermission(['group:members:add', 'group:manage'])) {
    return true;
  }

  if (this.currentUserId && group.creatorId === this.currentUserId) {
    return true;
  }

  return this.hasGroupScopedPermission(group.id, [
    'group:members:add',
    'group:manage'
  ]);
}

private canRemoveMembers(group: UiGroup): boolean {
  if (this.hasAnyPermission(['group:members:remove', 'group:manage'])) {
    return true;
  }

  if (this.currentUserId && group.creatorId === this.currentUserId) {
    return true;
  }

  return this.hasGroupScopedPermission(group.id, [
    'group:members:remove',
    'group:manage'
  ]);
}

  private canManageMembers(group: UiGroup): boolean {
  return this.canAddMembers(group) || this.canRemoveMembers(group);
}

  private hasAnyPermission(expected: string[]): boolean {
    const all = [...this.permissions, ...this.globalPermissions];
    return expected.some(permission => all.includes(permission));
  }

  private hasGroupScopedPermission(groupId: string, expected: string[]): boolean {
    if (!this.groupPermissionsRaw?.length) return false;

    return this.groupPermissionsRaw.some(item => {
      const id = item.grupo_id ?? item.groupId;
      const perms = item.permissions ?? [];
      return id === groupId && expected.some(permission => perms.includes(permission));
    });
  }
}