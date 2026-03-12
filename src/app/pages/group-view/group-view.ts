import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TimelineModule } from 'primeng/timeline';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { AppUser } from '../../models/user.model';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

interface TicketHistory {
  date: string;
  action: string;
  detail: string;
  user: string;
}

interface Ticket {
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
  history: TicketHistory[];
  createdBy: string;
  createdById: number;
}

interface GroupInfo {
  id: number;
  name: string;
  level: string;
  author: string;
  description: string;
  memberIds: number[];
}



const USERS_KEY = 'arp_users';
const GROUPS_KEY = 'arp_groups';
const TICKETS_KEY = 'arp_tickets';
const CURRENT_USER_KEY = 'arp_current_user';

@Component({
  selector: 'app-group-view',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    SelectModule,
    MessageModule,
    ToastModule,
    TimelineModule,
    SelectButtonModule,
    DragDropModule
  ],
  templateUrl: './group-view.html',
  styleUrl: './group-view.scss',
  providers: [MessageService]
})
export class GroupView implements OnInit {
  currentUser: AppUser | null = null;

  groupId = 0;
  dialogVisible = false;
  detailDialogVisible = false;
  submitted = false;
  currentCreatedAt = '';
  editingTicketId: number | null = null;
  selectedTicket: Ticket | null = null;
  viewMode: 'list' | 'kanban' = 'list';

  ticketForm: FormGroup;

  statusFilter = '';
  priorityFilter = '';
  createdAtFilter = '';
  dueDateFilter = '';
  sortField = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  viewOptions = [
    { label: 'Lista', value: 'list' },
    { label: 'Kanban', value: 'kanban' }
  ];

  sortOptions = [
    { label: 'Sin ordenar', value: '' },
    { label: 'Fecha creación', value: 'createdAt' },
    { label: 'Fecha límite', value: 'dueDate' },
    { label: 'Prioridad', value: 'priority' },
    { label: 'Estado', value: 'status' }
  ];

  orderOptions = [
    { label: 'Ascendente', value: 'asc' },
    { label: 'Descendente', value: 'desc' }
  ];

  groups: GroupInfo[] = [];
  private getGroups(): GroupInfo[] | null {
  const raw = localStorage.getItem(GROUPS_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as GroupInfo[];
  } catch {
    return null;
  }
}

private loadGroups(): void {
  const savedGroups = this.getGroups();
  this.groups = savedGroups ?? [];
}

  statusOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En progreso', value: 'En progreso' },
    { label: 'Revisión', value: 'Revisión' },
    { label: 'Finalizado', value: 'Finalizado' }
  ];

  priorityOptions = [
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' }
  ];


  tickets: Ticket[] = [];

 users: AppUser[] = [];

private getUsers(): AppUser[] | null {
  const raw = localStorage.getItem(USERS_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AppUser[];
  } catch {
    return null;
  }
}

private loadUsers(): void {
  const savedUsers = this.getUsers();
  this.users = savedUsers ?? [];
}

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private msg: MessageService
  ) {
    this.ticketForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      status: ['Pendiente', Validators.required],
      assignedTo: ['', Validators.required],
      priority: ['Media', Validators.required],
      dueDate: ['', Validators.required],
      comment: ['']
    });
  }


  ngOnInit(): void {

    this.loadUsers();
    this.loadGroups();
    this.loadCurrentUser();

    const id = this.route.snapshot.paramMap.get('id');
    this.groupId = Number(id);

    const savedTickets = this.getTickets();
this.tickets = (savedTickets ?? []).map(ticket => ({
  ...ticket,
  createdBy: ticket.createdBy ?? 'Usuario',
  createdById: ticket.createdById ?? 0
}));
  }

  get userOptions(): { label: string; value: string }[] {
  const group = this.selectedGroup;
  if (!group) return [];

  return this.users
    .filter(user => group.memberIds.includes(user.id))
    .map(user => ({
      label: user.fullName.split(' ')[0],
      value: user.fullName.split(' ')[0]
    }));
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

  private getTickets(): Ticket[] | null {
    const raw = localStorage.getItem(TICKETS_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as Ticket[];
    } catch {
      return null;
    }
  }

  private saveTickets(): void {
    localStorage.setItem(TICKETS_KEY, JSON.stringify(this.tickets));
  }

  get selectedGroup(): GroupInfo | undefined {
    return this.groups.find(group => group.id === this.groupId);
  }

  get ticketsByGroup(): Ticket[] {
    return this.tickets.filter(ticket => ticket.groupId === this.groupId);
  }

  get filteredTicketsByGroup(): Ticket[] {
    let result = [...this.ticketsByGroup];

    if (this.statusFilter) {
      result = result.filter(ticket => ticket.status === this.statusFilter);
    }

    if (this.priorityFilter) {
      result = result.filter(ticket => ticket.priority === this.priorityFilter);
    }

    if (this.createdAtFilter) {
      result = result.filter(ticket => ticket.createdAt === this.createdAtFilter);
    }

    if (this.dueDateFilter) {
      result = result.filter(ticket => ticket.dueDate === this.dueDateFilter);
    }

    if (this.sortField) {
      result.sort((a, b) => {
        let valueA: string | number = a[this.sortField as keyof Ticket] as string | number;
        let valueB: string | number = b[this.sortField as keyof Ticket] as string | number;

        if (this.sortField === 'priority') {
          const priorityOrder: Record<string, number> = {
            Baja: 1,
            Media: 2,
            Alta: 3
          };
          valueA = priorityOrder[valueA as string];
          valueB = priorityOrder[valueB as string];
        }

        if (this.sortOrder === 'asc') {
          return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        }

        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      });
    }

    return result;
  }

  get pendingTickets(): Ticket[] {
    return this.ticketsByGroup.filter(ticket => ticket.status === 'Pendiente');
  }

  get inProgressTickets(): Ticket[] {
    return this.ticketsByGroup.filter(ticket => ticket.status === 'En progreso');
  }

  get reviewTickets(): Ticket[] {
    return this.ticketsByGroup.filter(ticket => ticket.status === 'Revisión');
  }

  get doneTickets(): Ticket[] {
    return this.ticketsByGroup.filter(ticket => ticket.status === 'Finalizado');
  }

  get canCreateTickets(): boolean {
    return !!this.currentUser?.permissions.canCreateTickets;
  }

  get canEditTickets(): boolean {
    return !!this.currentUser?.permissions.canEditTickets;
  }

  get canViewTicketDetail(): boolean {
    return !!this.currentUser?.permissions.canViewTicketDetail;
  }
  

  showNoPermission(action: string): void {
    this.msg.add({
      severity: 'warn',
      summary: 'Sin permiso',
      detail: `No tienes permiso para ${action}.`
    });
  }

  handleNewTicket(): void {
    if (!this.canCreateTickets) {
      this.showNoPermission('crear tickets');
      return;
    }

    this.openNewTicket();
  }

  handleEditTicket(ticket: Ticket): void {
    if (!this.canEditTickets) {
      this.showNoPermission('editar tickets');
      return;
    }

    this.editTicket(ticket);
  }

  handleTicketDetail(ticket: Ticket): void {
    if (!this.canViewTicketDetail) {
      this.showNoPermission('ver el detalle del ticket');
      return;
    }

    this.openTicketDetail(ticket);
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.priorityFilter = '';
    this.createdAtFilter = '';
    this.dueDateFilter = '';
    this.sortField = '';
    this.sortOrder = 'asc';
  }

  isInvalid(name: string): boolean {
    const control = this.ticketForm.get(name);
    return !!control && control.invalid && (control.touched || this.submitted);
  }

  openNewTicket(): void {
    this.submitted = false;
    this.editingTicketId = null;
    this.currentCreatedAt = new Date().toISOString().split('T')[0];

    this.ticketForm.reset({
      title: '',
      description: '',
      status: 'Pendiente',
      assignedTo: '',
      priority: 'Media',
      dueDate: '',
      comment: ''
    });

    this.dialogVisible = true;
  }

  editTicket(ticket: Ticket): void {
    this.submitted = false;
    this.editingTicketId = ticket.id;
    this.currentCreatedAt = ticket.createdAt;

    this.ticketForm.reset({
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      assignedTo: ticket.assignedTo,
      priority: ticket.priority,
      dueDate: ticket.dueDate,
      comment: ''
    });

    this.dialogVisible = true;
  }

  openTicketDetail(ticket: Ticket): void {
  this.selectedTicket = ticket;
  this.submitted = false;

  this.ticketForm.reset({
    title: ticket.title,
    description: ticket.description,
    status: ticket.status,
    assignedTo: ticket.assignedTo,
    priority: ticket.priority,
    dueDate: ticket.dueDate,
    comment: ''
  });

  this.currentCreatedAt = ticket.createdAt;

  if (this.isTicketCreator) {
    this.ticketForm.enable();
  } else if (this.canOnlyEditStatusAndComment) {
    this.ticketForm.enable();

    this.ticketForm.get('title')?.disable();
    this.ticketForm.get('description')?.disable();
    this.ticketForm.get('assignedTo')?.disable();
    this.ticketForm.get('priority')?.disable();
    this.ticketForm.get('dueDate')?.disable();
  } else {
    this.ticketForm.disable();
  }

  this.detailDialogVisible = true;
}

  private buildHistoryChanges(oldTicket: Ticket, formValue: {
  title: string;
  description: string;
  status: Ticket['status'];
  assignedTo: string;
  priority: Ticket['priority'];
  dueDate: string;
  comment: string;
}): TicketHistory[] {
  const changes: TicketHistory[] = [];
  const now = new Date().toLocaleString();
  const currentUserName =
    this.currentUser?.fullName || this.currentUser?.username || 'Usuario';

  if (oldTicket.title !== formValue.title) {
    changes.push({
      date: now,
      action: 'Cambio de título',
      detail: `De "${oldTicket.title}" a "${formValue.title}"`,
      user: currentUserName
    });
  }

  if (oldTicket.description !== formValue.description) {
    changes.push({
      date: now,
      action: 'Cambio de descripción',
      detail: 'Se actualizó la descripción del ticket',
      user: currentUserName
    });
  }

  if (oldTicket.status !== formValue.status) {
    changes.push({
      date: now,
      action: 'Cambio de estado',
      detail: `De "${oldTicket.status}" a "${formValue.status}"`,
      user: currentUserName
    });
  }

  if (oldTicket.assignedTo !== formValue.assignedTo) {
    changes.push({
      date: now,
      action: 'Cambio de asignado',
      detail: `De "${oldTicket.assignedTo}" a "${formValue.assignedTo}"`,
      user: currentUserName
    });
  }

  if (oldTicket.priority !== formValue.priority) {
    changes.push({
      date: now,
      action: 'Cambio de prioridad',
      detail: `De "${oldTicket.priority}" a "${formValue.priority}"`,
      user: currentUserName
    });
  }

  if (oldTicket.dueDate !== formValue.dueDate) {
    changes.push({
      date: now,
      action: 'Cambio de fecha límite',
      detail: `De "${oldTicket.dueDate}" a "${formValue.dueDate}"`,
      user: currentUserName
    });
  }

  if (formValue.comment && formValue.comment.trim()) {
    changes.push({
      date: now,
      action: 'Comentario agregado',
      detail: formValue.comment,
      user: currentUserName
    });
  }

  return changes;
}

  saveTicket(): void {
    this.submitted = true;

    if (this.ticketForm.invalid) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Completa el formulario correctamente.'
      });
      return;
    }

    const value = this.ticketForm.getRawValue() as {
      title: string;
      description: string;
      status: Ticket['status'];
      assignedTo: string;
      priority: Ticket['priority'];
      dueDate: string;
      comment: string;
    };

    if (this.editingTicketId === null) {
      if (!this.canCreateTickets) {
        this.showNoPermission('crear tickets');
        return;
      }

      const newId = this.tickets.length ? Math.max(...this.tickets.map(t => t.id)) + 1 : 1;

      const newTicket: Ticket = {
  id: newId,
  title: value.title,
  description: value.description,
  status: value.status,
  assignedTo: value.assignedTo,
  priority: value.priority,
  createdAt: this.currentCreatedAt,
  dueDate: value.dueDate,
  comments: value.comment ? [value.comment] : [],
  groupId: this.groupId,
  createdBy: this.currentUser?.fullName || this.currentUser?.username || 'Usuario',
  createdById: this.currentUser?.id || 0,
  history: [
    {
      date: new Date().toLocaleString(),
      action: 'Creación',
      detail: 'Se creó el ticket',
      user: 'Admin'
    },
    ...(value.comment
      ? [
          {
            date: new Date().toLocaleString(),
            action: 'Comentario agregado',
            detail: value.comment,
            user: 'Admin'
          }
        ]
      : [])
  ]
};

      this.tickets = [newTicket, ...this.tickets];
      this.saveTickets();

      this.msg.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Ticket creado correctamente.'
      });
    } else {
      if (!this.canEditTickets) {
        this.showNoPermission('editar tickets');
        return;
      }

      this.tickets = this.tickets.map(ticket => {
        if (ticket.id !== this.editingTicketId) return ticket;

        const changes = this.buildHistoryChanges(ticket, value);

        return {
          ...ticket,
          title: value.title,
          description: value.description,
          status: value.status,
          assignedTo: value.assignedTo,
          priority: value.priority,
          dueDate: value.dueDate,
          comments: value.comment ? [...ticket.comments, value.comment] : ticket.comments,
          history: [...changes, ...ticket.history]
        };
      });

      this.saveTickets();

      this.msg.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Ticket actualizado correctamente.'
      });
    }

    this.dialogVisible = false;
    this.editingTicketId = null;
  }

  get pendingCount(): number {
  return this.pendingTickets.length;
}

get inProgressCount(): number {
  return this.inProgressTickets.length;
}

get reviewCount(): number {
  return this.reviewTickets.length;
}

get doneCount(): number {
  return this.doneTickets.length;
}

get totalTicketsCount(): number {
  return this.ticketsByGroup.length;
}

get isTicketCreator(): boolean {
  if (!this.selectedTicket || !this.currentUser) return false;
  return this.selectedTicket.createdById === this.currentUser.id;
}

get canOnlyEditStatusAndComment(): boolean {
  if (!this.selectedTicket || !this.currentUser) return false;

  const isMemberOfGroup = !!this.selectedGroup?.memberIds.includes(this.currentUser.id);
  return isMemberOfGroup && !this.isTicketCreator;
}

get canEditAllTicketFields(): boolean {
  return this.isTicketCreator;
}

dropTicket(
  event: CdkDragDrop<Ticket[]>,
  newStatus: Ticket['status']
): void {
  if (event.previousContainer === event.container) {
    return;
  }

  const movedTicket = event.previousContainer.data[event.previousIndex];

  if (!movedTicket) return;

  // si quieres, aquí puedes validar permiso para cambiar estado
 const isMemberOfGroup = !!this.selectedGroup?.memberIds.includes(this.currentUser?.id || 0);

if (!isMemberOfGroup) {
  this.showNoPermission('mover tickets entre columnas');
  return;
}

  movedTicket.status = newStatus;

  movedTicket.history = [
    {
      date: new Date().toLocaleString(),
      action: 'Cambio de estado',
      detail: `Movido a "${newStatus}" desde Kanban`,
      user: this.currentUser?.fullName || this.currentUser?.username || 'Usuario'
    },
    ...movedTicket.history
  ];

  this.saveTickets();
}


saveTicketDetail(): void {
  if (!this.selectedTicket) return;

  const ticket = this.selectedTicket;
  const rawValue = this.ticketForm.getRawValue() as {
    title: string;
    description: string;
    status: Ticket['status'];
    assignedTo: string;
    priority: Ticket['priority'];
    dueDate: string;
    comment: string;
  };

  const now = new Date().toLocaleString();
  const currentUserName =
    this.currentUser?.fullName || this.currentUser?.username || 'Usuario';

  if (this.isTicketCreator) {
    const changes = this.buildHistoryChanges(ticket, rawValue);

    this.tickets = this.tickets.map(t =>
      t.id === ticket.id
        ? {
            ...t,
            title: rawValue.title,
            description: rawValue.description,
            status: rawValue.status,
            assignedTo: rawValue.assignedTo,
            priority: rawValue.priority,
            dueDate: rawValue.dueDate,
            comments: rawValue.comment ? [...t.comments, rawValue.comment] : t.comments,
            history: [...changes, ...t.history]
          }
        : t
    );

    this.saveTickets();
    this.selectedTicket = this.tickets.find(t => t.id === ticket.id) || null;
    this.detailDialogVisible = false;

    this.msg.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: 'Ticket actualizado correctamente.'
    });

    return;
  }

  if (this.canOnlyEditStatusAndComment) {
    const changes: TicketHistory[] = [];

    if (ticket.status !== rawValue.status) {
      changes.push({
        date: now,
        action: 'Cambio de estado',
        detail: `De "${ticket.status}" a "${rawValue.status}"`,
        user: currentUserName
      });
    }

    if (rawValue.comment && rawValue.comment.trim()) {
      changes.push({
        date: now,
        action: 'Comentario agregado',
        detail: rawValue.comment,
        user: currentUserName
      });
    }

    this.tickets = this.tickets.map(t =>
      t.id === ticket.id
        ? {
            ...t,
            status: rawValue.status,
            comments: rawValue.comment ? [...t.comments, rawValue.comment] : t.comments,
            history: [...changes, ...t.history]
          }
        : t
    );

    this.saveTickets();
    this.selectedTicket = this.tickets.find(t => t.id === ticket.id) || null;
    this.detailDialogVisible = false;

    this.msg.add({
      severity: 'success',
      summary: 'Actualizado',
      detail: 'Se actualizó el estado y/o comentario del ticket.'
    });

    return;
  }

  this.showNoPermission('editar este ticket');
}
}