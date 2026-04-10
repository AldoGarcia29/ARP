import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

import { environment } from '../../../environments/environment';

type CurrentUser = {
  id: string;
  username: string;
  email: string;
  nombre_completo?: string;
  fullName?: string;
  user?: {
    id?: string;
    username?: string;
    email?: string;
    nombre_completo?: string;
    fullName?: string;
  };
};

type GroupMember = {
  id: string;
  username?: string;
  email?: string;
  nombre_completo?: string;
};

type GroupModel = {
  id: string;
  nivel: 'Beginner' | 'Intermediate' | 'Advanced';
  autor: string;
  creador_id: string;
  nombre: string;
  descripcion: string;
  members?: GroupMember[];
  ticketsCount?: number;
};

type TicketModel = {
  id: string;
  title: string;
  description: string;
  status: 'Pendiente' | 'En progreso' | 'Revisión' | 'Finalizado' | 'Cancelado';
  assignedTo: string;
  assignedUserId: string | null;
  priority: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  createdAt: string;
  dueDate: string;
  comments: string[];
  groupId: string;
  history: {
    date: string;
    action: string;
    detail: string;
    user: string;
  }[];
};

const CURRENT_USER_KEY = 'arp_current_user';
const GLOBAL_PERMISSIONS_KEY = 'arp_global_permissions';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, TagModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  private http = inject(HttpClient);

  currentUser: CurrentUser | null = null;
  globalPermissions: string[] = [];

  groups: GroupModel[] = [];
  tickets: TicketModel[] = [];

  loadingGroups = false;
  loadingTickets = false;

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadGlobalPermissions();
    this.loadGroups();
    this.loadTickets();
  }

  private loadCurrentUser(): void {
    const raw = localStorage.getItem(CURRENT_USER_KEY);

    if (!raw) {
      this.currentUser = null;
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      this.currentUser = {
        id: parsed?.id ?? parsed?.user?.id ?? '',
        username: parsed?.username ?? parsed?.user?.username ?? '',
        email: parsed?.email ?? parsed?.user?.email ?? '',
        nombre_completo:
          parsed?.nombre_completo ??
          parsed?.user?.nombre_completo ??
          '',
        fullName:
          parsed?.fullName ??
          parsed?.user?.fullName ??
          parsed?.nombre_completo ??
          parsed?.user?.nombre_completo ??
          ''
      };
    } catch {
      this.currentUser = null;
    }
  }

  private loadGlobalPermissions(): void {
    const raw = localStorage.getItem(GLOBAL_PERMISSIONS_KEY);

    if (!raw) {
      this.globalPermissions = [];
      return;
    }

    try {
      this.globalPermissions = JSON.parse(raw) || [];
    } catch {
      this.globalPermissions = [];
    }
  }

  private loadGroups(): void {
    this.loadingGroups = true;

    this.http.get<any>(environment.groups).subscribe({
      next: (resp) => {
        const list = Array.isArray(resp?.data) ? resp.data : [];

        this.groups = list.map((g: any) => ({
          id: g.id,
          nivel: g.nivel ?? g.level ?? 'Beginner',
          autor: g.autor ?? g.author ?? '',
          creador_id: g.creador_id ?? g.creatorId ?? '',
          nombre: g.nombre ?? g.name ?? '',
          descripcion: g.descripcion ?? g.description ?? '',
          members: Array.isArray(g.members) ? g.members : [],
          ticketsCount: Number(g.ticketsCount ?? g.tickets_count ?? 0)
        }));

        this.loadingGroups = false;
      },
      error: (err) => {
        console.error('Error al cargar grupos:', err);
        this.groups = [];
        this.loadingGroups = false;
      }
    });
  }

private loadTickets(): void {
  this.loadingTickets = true;

  this.http.get<any>(environment.tickets).subscribe({
    next: (resp) => {
      console.log('TICKETS BACKEND:', resp);

      const list = Array.isArray(resp?.data) ? resp.data : [];

      this.tickets = list.map((t: any) => ({
        id: String(t.id),
        title: t.titulo ?? t.title ?? '',
        description: t.descripcion ?? t.description ?? '',
        status: t.estado_nombre ?? t.status ?? 'Pendiente',
        assignedTo:
          t.asignado_nombre_completo ??
          t.asignado_username ??
          t.assignedTo ??
          '',
        assignedUserId:
          t.asignado_id ? String(t.asignado_id) : null,
        priority: t.prioridad_nombre ?? t.priority ?? 'Media',
        createdAt: t.creado_en ?? t.createdAt ?? '',
        dueDate: t.fecha_limite ?? t.dueDate ?? '',
        comments: Array.isArray(t.comments) ? t.comments : [],
        groupId: String(t.grupo_id ?? t.group_id ?? t.groupId ?? ''),
        history: Array.isArray(t.history) ? t.history : []
      }));

      this.loadingTickets = false;
    },
    error: (err) => {
      console.error('Error al cargar tickets:', err);
      this.tickets = [];
      this.loadingTickets = false;
    }
  });
}

  get isSuperAdmin(): boolean {
    const email = this.currentUser?.email?.toLowerCase() ?? '';

    return (
      email === 'aldoprogarciapacheco@gmail.com' ||
      this.globalPermissions.includes('user:manage') ||
      this.globalPermissions.includes('group:manage') ||
      this.globalPermissions.includes('user:view')
    );
  }

  get displayName(): string {
    if (!this.currentUser) return '';
    return (
      this.currentUser.nombre_completo ||
      this.currentUser.fullName ||
      this.currentUser.username ||
      ''
    );
  }

  get currentUserShortName(): string {
    if (!this.displayName) return '';
    return this.displayName.split(' ')[0];
  }

  get visibleGroups(): GroupModel[] {
    if (!this.currentUser) return [];

    if (this.isSuperAdmin) {
      return this.groups;
    }

    return this.groups.filter(group =>
      (group.members ?? []).some(member => member.id === this.currentUser!.id)
    );
  }

  get visibleGroupIds(): string[] {
    return this.visibleGroups.map(group => group.id);
  }

  get visibleTickets(): TicketModel[] {
    if (this.isSuperAdmin) {
      return this.tickets;
    }

    return this.tickets.filter(ticket =>
      this.visibleGroupIds.includes(ticket.groupId)
    );
  }

 get assignedOrVisibleTickets(): TicketModel[] {
  if (!this.currentUser) return [];

  if (this.isSuperAdmin) {
    return this.tickets;
  }

  return this.tickets.filter(ticket =>
    ticket.assignedUserId === this.currentUser!.id
  );
}

  get totalTickets(): number {
    return this.visibleTickets.length;
  }

  get pendingTicketsCount(): number {
    return this.visibleTickets.filter(t => t.status === 'Pendiente').length;
  }

  get inProgressTicketsCount(): number {
    return this.visibleTickets.filter(t => t.status === 'En progreso').length;
  }

  get reviewTicketsCount(): number {
    return this.visibleTickets.filter(t => t.status === 'Revisión').length;
  }

  get doneTicketsCount(): number {
    return this.visibleTickets.filter(t => t.status === 'Finalizado').length;
  }

  getGroupName(groupId: string): string {
    const group = this.groups.find(g => g.id === groupId);
    return group ? group.nombre : 'Sin grupo';
  }

  levelSeverity(level: string): 'success' | 'warn' | 'danger' {
    if (level === 'Advanced') return 'danger';
    if (level === 'Intermediate') return 'warn';
    return 'success';
  }

  statusSeverity(status: string): 'contrast' | 'warn' | 'info' | 'success' {
    if (status === 'Pendiente') return 'warn';
    if (status === 'En progreso') return 'info';
    if (status === 'Revisión') return 'contrast';
    return 'success';
  }

  prioritySeverity(priority: string): 'success' | 'warn' | 'danger' {
    if (priority === 'Alta' || priority === 'Crítica') return 'danger';
    if (priority === 'Media') return 'warn';
    return 'success';
  }
}