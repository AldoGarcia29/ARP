import { Injectable } from '@angular/core';

interface GroupPermissionItem {
  grupo_id?: string;
  group_id?: string;
  groupId?: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private globalPermissions: string[] = [];
  private groupPermissionsRaw: GroupPermissionItem[] = [];
  private currentGroupPermissions: string[] = [];
  private activeGroupId: string | null = null;

  constructor() {
    this.reloadPermissions();
  }

  // 🔄 Recarga todo desde localStorage
  reloadPermissions(): void {
    this.loadGlobalPermissions();
    this.loadGroupPermissions();
  }

  private loadGlobalPermissions(): void {
    try {
      this.globalPermissions = JSON.parse(
        localStorage.getItem('arp_global_permissions') || '[]'
      );
    } catch {
      this.globalPermissions = [];
    }
  }

  private loadGroupPermissions(): void {
    try {
      this.groupPermissionsRaw = JSON.parse(
        localStorage.getItem('arp_group_permissions') || '[]'
      );
    } catch {
      this.groupPermissionsRaw = [];
    }
  }

  // ✅ Permiso global solamente
  hasPermission(permission: string): boolean {
    return this.globalPermissions.includes(permission);
  }

  // ✅ Permiso por grupo (también acepta global como override)
  hasPermissionForGroup(permission: string, groupId: string): boolean {
    if (!permission || !groupId) return false;

    // si el permiso existe a nivel global, también cuenta
    if (this.globalPermissions.includes(permission)) {
      return true;
    }

    return this.groupPermissionsRaw.some((group) => {
      const id = group.grupo_id ?? group.group_id ?? group.groupId;
      const perms = group.permissions ?? [];

      return id === groupId && perms.includes(permission);
    });
  }

  // ✅ Carga permisos del grupo "activo"
  refreshPermissionsForGroup(groupId: string): void {
    this.activeGroupId = groupId;

    const group = this.groupPermissionsRaw.find((g) => {
      const id = g.grupo_id ?? g.group_id ?? g.groupId;
      return id === groupId;
    });

    this.currentGroupPermissions = group?.permissions || [];
  }

  // ✅ Limpia contexto del grupo activo
  clearGroupPermissions(): void {
    this.activeGroupId = null;
    this.currentGroupPermissions = [];
  }

  // útil para debug
  getCurrentPermissions(): string[] {
    return [...this.globalPermissions, ...this.currentGroupPermissions];
  }

  getActiveGroupId(): string | null {
    return this.activeGroupId;
  }
}