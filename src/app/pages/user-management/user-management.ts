import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { ToastModule } from 'primeng/toast';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';

import { MessageService } from 'primeng/api';
import { environment } from '../../../environments/environment';

interface UserRow {
  id: string;
  username: string;
  email: string;
  nombre_completo: string;
  direccion: string;
  telefono: string;
  fecha_nac: string;
  activo?: boolean;
  creado_en?: string;
}

interface PermissionItem {
  id: string;
  codigo: string;
  descripcion: string;
  scope: 'global' | 'group';
}

interface UserGroupPermissionBlock {
  grupo_id: string;
  grupo_nombre: string;
  permissions: PermissionItem[];
}

interface UserFullResponse {
  user: UserRow;
  globalPermissions: PermissionItem[];
  groupPermissions: UserGroupPermissionBlock[];
}

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
    ToastModule,
    MessageModule,
    DividerModule
  ],
  templateUrl: './user-management.html',
  styleUrls: ['./user-management.scss'],
  providers: [MessageService]
})
export class UserManagement implements OnInit {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private msg = inject(MessageService);

  private baseUsersUrl = environment.auth;
  private basePermissionsUrl = environment.permissions;

  users: UserRow[] = [];

  globalPermissionsCatalog: PermissionItem[] = [];
  groupPermissionsCatalog: PermissionItem[] = [];

  userGroups: Array<{
    grupo_id: string;
    grupo_nombre: string;
  }> = [];

  dialogVisible = false;
  submitted = false;
  loading = false;
  saving = false;

  editingUserId: string | null = null;
  selectedGroupId: string | null = null;

  selectedGlobalPermissionIds: string[] = [];
  groupPermissionsState: Record<string, string[]> = {};

  form: FormGroup = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    fullName: ['', Validators.required],
    password: [''],
    address: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    birthDate: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadInitialData();
  }

  get isEditing(): boolean {
    return this.editingUserId !== null;
  }

  get selectedGroupPermissionIds(): string[] {
    if (!this.selectedGroupId) return [];
    return this.groupPermissionsState[String(this.selectedGroupId)] ?? [];
  }

  get selectedGroupName(): string {
    if (!this.selectedGroupId) return '';
    return this.userGroups.find(g => g.grupo_id === String(this.selectedGroupId))?.grupo_nombre ?? '';
  }

  loadInitialData(): void {
    this.loading = true;

    Promise.all([
      this.loadUsers(),
      this.loadPermissionsCatalog()
    ]).finally(() => {
      this.loading = false;
    });
  }

  private loadUsers(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(this.baseUsersUrl).subscribe({
        next: (response) => {
          this.users = Array.isArray(response?.data) ? response.data : [];
          resolve();
        },
        error: (err) => {
          console.error('Error al cargar usuarios:', err);
          this.users = [];
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudieron cargar los usuarios.'
          });
          resolve();
        }
      });
    });
  }

  private loadPermissionsCatalog(): Promise<void> {
    return new Promise((resolve) => {
      this.http.get<any>(`${this.basePermissionsUrl}/catalog`).subscribe({
        next: (response) => {
          this.globalPermissionsCatalog = (response?.data?.globalPermissions ?? []).map((p: any) => ({
            ...p,
            id: String(p.id)
          }));

          this.groupPermissionsCatalog = (response?.data?.groupPermissions ?? []).map((p: any) => ({
            ...p,
            id: String(p.id)
          }));

          resolve();
        },
        error: (err) => {
          console.error('Error al cargar catálogo de permisos:', err);
          this.globalPermissionsCatalog = [];
          this.groupPermissionsCatalog = [];
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo cargar el catálogo de permisos.'
          });
          resolve();
        }
      });
    });
  }

  openNew(): void {
    this.resetDialogState();

    this.form.reset({
      username: '',
      email: '',
      fullName: '',
      password: '',
      address: '',
      phone: '',
      birthDate: ''
    });

    this.form.get('password')?.setValidators([Validators.required]);
    this.form.get('password')?.updateValueAndValidity();

    this.dialogVisible = true;
  }

  editUser(user: UserRow): void {
    this.resetDialogState();
    this.editingUserId = String(user.id);

    this.form.reset({
      username: '',
      email: '',
      fullName: '',
      password: '',
      address: '',
      phone: '',
      birthDate: ''
    });

    this.form.get('password')?.clearValidators();
    this.form.get('password')?.updateValueAndValidity();

    this.http.get<any>(`${this.baseUsersUrl}/${user.id}/full`).subscribe({
      next: (response) => {
        const data: UserFullResponse = response?.data;

        if (!data?.user) {
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'La respuesta del usuario no es válida.'
          });
          return;
        }

        this.form.patchValue({
          username: data.user.username ?? '',
          email: data.user.email ?? '',
          fullName: data.user.nombre_completo ?? '',
          password: '',
          address: data.user.direccion ?? '',
          phone: data.user.telefono ?? '',
          birthDate: data.user.fecha_nac
            ? String(data.user.fecha_nac).substring(0, 10)
            : ''
        });

        this.selectedGlobalPermissionIds = (data.globalPermissions ?? []).map((p: any) => String(p.id));

        this.userGroups = (data.groupPermissions ?? []).map((g: any) => ({
          grupo_id: String(g.grupo_id),
          grupo_nombre: g.grupo_nombre
        }));

        this.groupPermissionsState = {};

        for (const gp of data.groupPermissions ?? []) {
          this.groupPermissionsState[String(gp.grupo_id)] =
            (gp.permissions ?? []).map((p: any) => String(p.id));
        }

        this.selectedGroupId = this.userGroups.length > 0
          ? this.userGroups[0].grupo_id
          : null;

        if (this.selectedGroupId && !this.groupPermissionsState[String(this.selectedGroupId)]) {
          this.groupPermissionsState[String(this.selectedGroupId)] = [];
        }

        console.log('CATALOGO GLOBALES', this.globalPermissionsCatalog);
        console.log('SELECCIONADOS GLOBALES', this.selectedGlobalPermissionIds);

        this.dialogVisible = true;
      },
      error: (err) => {
        console.error('Error al cargar detalle del usuario:', err);
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo cargar el detalle del usuario.'
        });
      }
    });
  }

  toggleGlobalPermission(permissionId: string, checked: boolean): void {
    const normalizedId = String(permissionId);

    if (checked) {
      if (!this.selectedGlobalPermissionIds.includes(normalizedId)) {
        this.selectedGlobalPermissionIds = [...this.selectedGlobalPermissionIds, normalizedId];
      }
      return;
    }

    this.selectedGlobalPermissionIds =
      this.selectedGlobalPermissionIds.filter(id => id !== normalizedId);
  }

  hasGlobalPermission(permissionId: string): boolean {
    return this.selectedGlobalPermissionIds.includes(String(permissionId));
  }

  onSelectedGroupChange(): void {
    if (!this.selectedGroupId) return;

    const normalizedGroupId = String(this.selectedGroupId);

    if (!this.groupPermissionsState[normalizedGroupId]) {
      this.groupPermissionsState[normalizedGroupId] = [];
    }
  }

  toggleGroupPermission(permissionId: string, checked: boolean): void {
    if (!this.selectedGroupId) return;

    const normalizedPermissionId = String(permissionId);
    const normalizedGroupId = String(this.selectedGroupId);

    const current = this.groupPermissionsState[normalizedGroupId] ?? [];

    if (checked) {
      if (!current.includes(normalizedPermissionId)) {
        this.groupPermissionsState[normalizedGroupId] = [...current, normalizedPermissionId];
      }
      return;
    }

    this.groupPermissionsState[normalizedGroupId] =
      current.filter(id => id !== normalizedPermissionId);
  }

  hasGroupPermission(permissionId: string): boolean {
    if (!this.selectedGroupId) return false;

    return (this.groupPermissionsState[String(this.selectedGroupId)] ?? [])
      .includes(String(permissionId));
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

    this.saving = true;

    if (this.isEditing) {
      this.updateUserAndPermissions();
      return;
    }

    this.createUserAndPermissions();
  }

  private createUserAndPermissions(): void {
    const v = this.form.getRawValue();

    const registerPayload = {
      username: v.username,
      email: v.email,
      nombre_completo: v.fullName,
      direccion: v.address,
      telefono: v.phone,
      fecha_nac: v.birthDate,
      password: v.password
    };

    this.http.post<any>(`${this.baseUsersUrl}/register`, registerPayload).subscribe({
      next: (response) => {
        const createdUserId =
          response?.data?.[0]?.user?.id ??
          null;

        if (!createdUserId) {
          this.saving = false;
          this.dialogVisible = false;

          this.msg.add({
            severity: 'warn',
            summary: 'Aviso',
            detail: 'Usuario creado, pero no se pudo obtener su id para asignar permisos.'
          });

          this.loadUsers();
          return;
        }

        this.savePermissionsForUser(String(createdUserId), 'Usuario creado correctamente.');
      },
      error: (err) => {
        console.error('Error al crear usuario:', err);
        this.saving = false;
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo crear el usuario.'
        });
      }
    });
  }

  private updateUserAndPermissions(): void {
    if (!this.editingUserId) {
      this.saving = false;
      return;
    }

    const v = this.form.getRawValue();

    const updatePayload: any = {
      username: v.username,
      email: v.email,
      nombre_completo: v.fullName,
      direccion: v.address,
      telefono: v.phone,
      fecha_nac: v.birthDate
    };

    if (typeof v.password === 'string' && v.password.trim().length > 0) {
      updatePayload.password = v.password;
    }

    this.http.put<any>(`${this.baseUsersUrl}/${this.editingUserId}`, updatePayload).subscribe({
      next: () => {
        this.savePermissionsForUser(String(this.editingUserId), 'Usuario actualizado correctamente.');
      },
      error: (err) => {
        console.error('Error al actualizar usuario:', err);
        this.saving = false;
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo actualizar el usuario.'
        });
      }
    });
  }

  private savePermissionsForUser(userId: string, successMessage: string): void {
    const groupPermissionsPayload = Object.entries(this.groupPermissionsState).map(
      ([grupo_id, permissionIds]) => ({
        grupo_id: String(grupo_id),
        permissionIds: (Array.isArray(permissionIds) ? permissionIds : []).map(id => String(id))
      })
    );

    const payload = {
      globalPermissionIds: this.selectedGlobalPermissionIds.map(id => String(id)),
      groupPermissions: groupPermissionsPayload
    };

    console.log('PAYLOAD PERMISOS', payload);

    this.http.put<any>(`${this.baseUsersUrl}/${userId}/permissions`, payload).subscribe({
      next: () => {
        this.saving = false;
        this.dialogVisible = false;
        this.editingUserId = null;

        this.msg.add({
          severity: 'success',
          summary: 'Correcto',
          detail: successMessage
        });

        this.loadUsers();
      },
      error: (err) => {
        console.error('Error al guardar permisos:', err);
        this.saving = false;
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudieron guardar los permisos.'
        });
      }
    });
  }

  deleteUser(user: UserRow): void {
    if (!confirm(`¿Eliminar al usuario "${user.username}"?`)) {
      return;
    }

    this.http.delete<any>(`${this.baseUsersUrl}/${user.id}`).subscribe({
      next: () => {
        this.msg.add({
          severity: 'warn',
          summary: 'Eliminado',
          detail: 'Usuario eliminado correctamente.'
        });
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error al eliminar usuario:', err);
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo eliminar el usuario.'
        });
      }
    });
  }

  closeDialog(): void {
    this.dialogVisible = false;
    this.resetDialogState();
  }

  private resetDialogState(): void {
    this.submitted = false;
    this.saving = false;
    this.editingUserId = null;
    this.selectedGroupId = null;
    this.selectedGlobalPermissionIds = [];
    this.groupPermissionsState = {};
    this.userGroups = [];
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }

  getRoleLabel(user: UserRow): string {
    if (user.email === 'aldoprogarciapacheco@gmail.com') {
      return 'superAdmin';
    }
    return 'usuario';
  }

  getTicketLevelLabel(_: UserRow): string {
    return 'Gestionado por permisos';
  }
}