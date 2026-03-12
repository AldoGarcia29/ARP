import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';

type UserPermissions = {
  canCreateGroup: boolean;
  canEditGroup: boolean;
  canDeleteGroup: boolean;
  canAddMembers: boolean;
  canRemoveMembers: boolean;
  canCreateTickets: boolean;
  canEditTickets: boolean;
  canViewTicketDetail: boolean;
};

type AppUser = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  password: string;
  permissions: UserPermissions;
};

type GroupModel = {
  id: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  author: string;
  name: string;
  description: string;
  memberIds: number[];
};

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

const CURRENT_USER_KEY = 'arp_current_user';
const GROUPS_KEY = 'arp_groups';
const TICKETS_KEY = 'arp_tickets';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule, ButtonModule, TagModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home implements OnInit {
  currentUser: AppUser | null = null;
  groups: GroupModel[] = [];
  tickets: Ticket[] = [];

  ngOnInit(): void {
    this.loadCurrentUser();
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
      this.currentUser = JSON.parse(raw) as AppUser;
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
      this.groups = JSON.parse(raw) as GroupModel[];
    } catch {
      this.groups = [];
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

  get myGroups(): GroupModel[] {
    if (!this.currentUser) return [];

    return this.groups.filter(group =>
      group.memberIds.includes(this.currentUser!.id)
    );
  }

  get myGroupIds(): number[] {
    return this.myGroups.map(group => group.id);
  }

  get myGroupsTickets(): Ticket[] {
    return this.tickets.filter(ticket =>
      this.myGroupIds.includes(ticket.groupId)
    );
  }

  get currentUserShortName(): string {
    if (!this.currentUser?.fullName) return '';
    return this.currentUser.fullName.split(' ')[0];
  }

  get myAssignedTickets(): Ticket[] {
    if (!this.currentUser) return [];

    return this.tickets.filter(ticket =>
      ticket.assignedTo.toLowerCase() === this.currentUserShortName.toLowerCase()
    );
  }

  get totalTickets(): number {
    return this.myGroupsTickets.length;
  }

  get pendingTicketsCount(): number {
    return this.myGroupsTickets.filter(t => t.status === 'Pendiente').length;
  }

  get inProgressTicketsCount(): number {
    return this.myGroupsTickets.filter(t => t.status === 'En progreso').length;
  }

  get reviewTicketsCount(): number {
    return this.myGroupsTickets.filter(t => t.status === 'Revisión').length;
  }

  get doneTicketsCount(): number {
    return this.myGroupsTickets.filter(t => t.status === 'Finalizado').length;
  }

  getGroupName(groupId: number): string {
    const group = this.groups.find(g => g.id === groupId);
    return group ? group.name : 'Sin grupo';
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
    if (priority === 'Alta') return 'danger';
    if (priority === 'Media') return 'warn';
    return 'success';
  }
}