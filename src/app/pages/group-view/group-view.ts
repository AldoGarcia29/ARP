import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormsModule,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';

import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TimelineModule } from 'primeng/timeline';
import { SelectButtonModule } from 'primeng/selectbutton';
import { MessageService } from 'primeng/api';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';

import { AppUser } from '../../models/user.model';
import { TicketService, TicketApi } from '../../services/ticket.service';
import { HasPermissionDirective } from '../../directives/has-permission.directive';
import { HasGroupPermissionDirective } from '../../directives/has-group-permission.directive';
import { GroupService } from '../../services/group.service';

const USERS_KEY = 'arp_users';
const GROUPS_KEY = 'arp_groups';
const CURRENT_USER_KEY = 'arp_current_user';

interface TicketHistory {
  date: string;
  action: string;
  detail: string;
  user: string;
}

interface Ticket {
  id: string;
  titulo: string;
  descripcion: string;
  estado: string;
  estadoId: string;
  asignadoA: string;
  asignadoId: string | null;
  prioridad: string;
  prioridadId: string;
  creadoEn: string;
  fechaLimite: string;
  fechaFinal: string | null;
  grupoId: string;
  autorId: string;
  autorNombre: string;
  comments: string[];
  history: TicketHistory[];
}

interface GroupInfo {
  id: string;
  name: string;
  level: string;
  author: string;
  description: string;
  memberIds: Array<string | number>;
}

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
    DragDropModule,
    HasPermissionDirective,
    HasGroupPermissionDirective
  ],
  templateUrl: './group-view.html',
  styleUrl: './group-view.scss',
  providers: [MessageService]
})
export class GroupView implements OnInit {
  currentUser: AppUser | null = null;

  groupId = '';
  dialogVisible = false;
  detailDialogVisible = false;
  submitted = false;
  currentCreatedAt = '';
  editingTicketId: string | null = null;
  selectedTicket: Ticket | null = null;
  viewMode: 'list' | 'kanban' = 'list';

  ticketForm: FormGroup;

  statusFilter = '';
  priorityFilter = '';
  createdAtFilter = '';
  dueDateFilter = '';
  sortField = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  groups: GroupInfo[] = [];
  users: AppUser[] = [];
  tickets: Ticket[] = [];

  groupMembers: Array<{
  id: string;
  username?: string;
  email: string;
  nombre_completo?: string;
}> = [];

  viewOptions = [
    { label: 'Lista', value: 'list' },
    { label: 'Kanban', value: 'kanban' }
  ];

  sortOptions = [
    { label: 'Sin ordenar', value: '' },
    { label: 'Fecha creación', value: 'creadoEn' },
    { label: 'Fecha límite', value: 'fechaLimite' },
    { label: 'Prioridad', value: 'prioridad' },
    { label: 'Estado', value: 'estado' }
  ];

  orderOptions = [
    { label: 'Ascendente', value: 'asc' },
    { label: 'Descendente', value: 'desc' }
  ];

  statusOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En progreso', value: 'En proceso' },
    { label: 'Hecho', value: 'Resuelto' },
    { label: 'Bloqueado', value: 'Cancelado' }
  ];

  /**
   * AQUÍ PON TUS IDS REALES DE PRIORIDAD
   * Puedes cambiarlos cuando me pases la tabla de prioridades.
   */
  priorityCatalog: Record<string, string> = {
  'Baja': 'fe9de325-a264-418d-b78f-87f0c9d8a67b',
  'Media': '8ac2963d-c507-49b1-976a-f70875b39cea',
  'Alta': 'e3624960-a46c-4bb6-bcb7-e2514035db4',
  'Crítica': '90de4fe2-94af-4cb8-834e-c94991b39dc8'
};

  priorityOptions = [
    { label: 'Baja', value: 'Baja' },
    { label: 'Media', value: 'Media' },
    { label: 'Alta', value: 'Alta' },
    { label: 'Crítica', value: 'Crítica' }
  ];

  /**
   * Estos sí los sacamos de tu captura real de estados.
   */
  statusCatalog: Record<string, string> = {
    'Pendiente': '54d984ee-2e6a-4279-8e87-ffba5f750a2b',
    'En proceso': '662f5788-c382-4d86-9399-b1fcbb0f05f4',
    'Resuelto': '4b538d39-1665-46fa-ad65-14546566bc9f',
    'Cancelado': 'ea1ec02f-5980-4b4b-b63b-43ca9c532b87'
  };

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private msg: MessageService,
    private ticketService: TicketService,
    private groupService: GroupService
  ) {
    this.ticketForm = this.fb.group({
      title: ['', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]],
      status: ['Pendiente', Validators.required],
      assignedTo: ['', Validators.required],   // guardará user.id
      priority: ['Media', Validators.required],
      dueDate: ['', Validators.required],
      comment: ['']
    });
  }

  loadGroupMembers(): void {
  if (!this.groupId) return;

  this.groupService.getGroupMembers(this.groupId).subscribe({
    next: (response) => {
      console.log("Miembros", response.data);
      this.groupMembers = response.data ?? [];
    },
    error: (error) => {
      console.error('Error al cargar miembros del grupo:', error);
      this.groupMembers = [];
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los miembros del grupo.'
      });
    }
  });
}

loadTicketHistory(ticketId: string): void {
  this.ticketService.getTicketHistory(ticketId).subscribe({
    next: (response) => {
      if (!this.selectedTicket) return;

      this.selectedTicket.history = (response.data ?? []).map(item => ({
        date: item.creado_en,
        action: item.accion,
        detail: item.detalle,
        user: item.nombre_completo || item.username || 'Usuario'
      }));
    },
    error: (error) => {
      console.error('Error al cargar historial:', error);

      if (this.selectedTicket) {
        this.selectedTicket.history = [];
      }

      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudo cargar el historial del ticket.'
      });
    }
  });
}

  ngOnInit(): void {
    this.loadUsers();
    this.loadGroups();
    this.loadCurrentUser();

    const id = this.route.snapshot.paramMap.get('id');
    this.groupId = id ?? '';

    if (this.groupId) {
      this.loadTicketsByGroup();
      this.loadGroupMembers();
    }
  }

  get selectedGroup(): GroupInfo | undefined {
    return this.groups.find(group => String(group.id) === String(this.groupId));
  }

  get reviewCount(): number {
    return this.blockedCount;
  }

  get userOptions(): { label: string; value: string }[] {
  return this.groupMembers.map(user => ({
    label: user.nombre_completo || user.username || user.email,
    value: String(user.id)
  }));
}

  get ticketsByGroup(): Ticket[] {
    return this.tickets;
  }

  get filteredTicketsByGroup(): Ticket[] {
    let result = [...this.ticketsByGroup];

    if (this.statusFilter) {
      result = result.filter(ticket => ticket.estado === this.statusFilter);
    }

    if (this.priorityFilter) {
      result = result.filter(ticket => ticket.prioridad === this.priorityFilter);
    }

    if (this.createdAtFilter) {
      result = result.filter(ticket => ticket.creadoEn?.startsWith(this.createdAtFilter));
    }

    if (this.dueDateFilter) {
      result = result.filter(ticket => ticket.fechaLimite?.startsWith(this.dueDateFilter));
    }

    if (this.sortField) {
      result.sort((a, b) => {
        let valueA = (a[this.sortField as keyof Ticket] ?? '') as string;
        let valueB = (b[this.sortField as keyof Ticket] ?? '') as string;

        if (this.sortField === 'prioridad') {
          const priorityOrder: Record<string, number> = {
            Baja: 1,
            Media: 2,
            Alta: 3,
            Crítica: 4
          };

          const pA = priorityOrder[valueA] ?? 0;
          const pB = priorityOrder[valueB] ?? 0;
          return this.sortOrder === 'asc' ? pA - pB : pB - pA;
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
    return this.ticketsByGroup.filter(ticket => ticket.estado === 'Pendiente');
  }

  get inProgressTickets(): Ticket[] {
    return this.ticketsByGroup.filter(ticket => ticket.estado === 'En proceso');
  }

  get blockedTickets(): Ticket[] {
    return this.ticketsByGroup.filter(ticket => ticket.estado === 'Cancelado');
  }

  get doneTickets(): Ticket[] {
    return this.ticketsByGroup.filter(ticket => ticket.estado === 'Resuelto');
  }

  get pendingCount(): number {
    return this.pendingTickets.length;
  }

  get inProgressCount(): number {
    return this.inProgressTickets.length;
  }

  get blockedCount(): number {
    return this.blockedTickets.length;
  }

  get doneCount(): number {
    return this.doneTickets.length;
  }

  get totalTicketsCount(): number {
    return this.ticketsByGroup.length;
  }

  get isTicketCreator(): boolean {
    if (!this.selectedTicket || !this.currentUser) return false;
    return String(this.selectedTicket.autorId) === String(this.currentUser.id);
  }

  get canOnlyEditStatusAndComment(): boolean {
    if (!this.selectedTicket || !this.currentUser) return false;

    const isMemberOfGroup = !!this.selectedGroup?.memberIds.some(
      memberId => String(memberId) === String(this.currentUser?.id)
    );

    return isMemberOfGroup && !this.isTicketCreator;
  }

  get canEditAllTicketFields(): boolean {
    return this.isTicketCreator;
  }

  private normalizeStatus(status: string): string {
    const value = status.trim().toLowerCase();

    if (value === 'pendiente') return 'Pendiente';
    if (value === 'en proceso') return 'En proceso';
    if (value === 'resuelto') return 'Resuelto';
    if (value === 'cancelado') return 'Cancelado';

    return status;
  }

  private normalizePriority(priority: string): string {
    const value = priority.trim().toLowerCase();

    if (value === 'baja') return 'Baja';
    if (value === 'media') return 'Media';
    if (value === 'alta') return 'Alta';
    if (value === 'crítica' || value === 'critica') return 'Crítica';

    return priority;
  }

  loadTicketsByGroup(): void {
    if (!this.groupId) return;

    this.ticketService.getTicketsByGroup(this.groupId).subscribe({
      next: (response) => {
        this.tickets = response.data.map((ticket: TicketApi) => {
          const prioridadNombre = this.normalizePriority(ticket.prioridad_nombre || '');
          if (prioridadNombre && ticket.prioridad_id) {
            this.priorityCatalog[prioridadNombre] = ticket.prioridad_id;
          }

          return {
            id: ticket.id,
            titulo: ticket.titulo,
            descripcion: ticket.descripcion,
            estado: this.normalizeStatus(ticket.estado_nombre || ticket.estado_id),
            estadoId: ticket.estado_id,
            asignadoA: ticket.asignado_username || 'Sin asignar',
            asignadoId: ticket.asignado_id || null,
            prioridad: prioridadNombre || ticket.prioridad_id,
            prioridadId: ticket.prioridad_id,
            creadoEn: ticket.creado_en,
            fechaLimite: ticket.fecha_limite || '',
            fechaFinal: ticket.fecha_final,
            grupoId: ticket.grupo_id,
            autorId: ticket.autor_id,
            autorNombre: ticket.autor_username || 'Usuario',
            comments: [],
            history: []
          };
        });
      },
      error: (error) => {
        console.error('Error al cargar tickets:', error);
        this.tickets = [];
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudieron cargar los tickets del grupo.'
        });
      }
    });
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
    this.users = this.getUsers() ?? [];
  }

  private getGroups(): GroupInfo[] | null {
    const raw = localStorage.getItem(GROUPS_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as GroupInfo[];
    } catch {
      return null;
    }
  }

  loadGroups(): void {
  this.groupService.getAll().subscribe({
    next: (response) => {
      this.groups = (response.data ?? []).map((group: any) => ({
        id: group.id,
        name: group.nombre,
        level: group.nivel,
        author: group.autor,
        description: group.descripcion,
        memberIds: (group.members ?? []).map((member: any) => member.id)
      }));
    },
    error: (error) => {
      console.error('Error al cargar grupos:', error);
      this.groups = [];
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los grupos.'
      });
    }
  });
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
    this.currentCreatedAt = ticket.creadoEn?.split('T')[0] || '';

    this.ticketForm.reset({
      title: ticket.titulo,
      description: ticket.descripcion,
      status: ticket.estado,
      assignedTo: ticket.asignadoId || '',
      priority: ticket.prioridad,
      dueDate: ticket.fechaLimite,
      comment: ''
    });

    this.dialogVisible = true;
  }

  openTicketDetail(ticket: Ticket): void {
  this.selectedTicket = {
    ...ticket,
    history: []
  };

  this.submitted = false;

  this.ticketForm.reset({
    title: ticket.titulo,
    description: ticket.descripcion,
    status: ticket.estado,
    assignedTo: ticket.asignadoId || '',
    priority: ticket.prioridad,
    dueDate: ticket.fechaLimite,
    comment: ''
  });

  this.currentCreatedAt = ticket.creadoEn?.split('T')[0] || '';

  this.ticketForm.enable();

  if (!this.canEditAllTicketFields) {
    this.ticketForm.get('title')?.disable();
    this.ticketForm.get('description')?.disable();
    this.ticketForm.get('assignedTo')?.disable();
    this.ticketForm.get('priority')?.disable();
    this.ticketForm.get('dueDate')?.disable();
  }

  this.loadTicketHistory(ticket.id);

  this.detailDialogVisible = true;
}

  handleNewTicket(): void {
    this.openNewTicket();
  }

  handleEditTicket(ticket: Ticket): void {
    this.editTicket(ticket);
  }

  handleTicketDetail(ticket: Ticket): void {
    this.openTicketDetail(ticket);
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
      status: string;
      assignedTo: string;
      priority: string;
      dueDate: string;
      comment: string;
    };

    const estado_id = this.statusCatalog[value.status];
    const prioridad_id = this.priorityCatalog[value.priority];

    if (!estado_id) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: `No se encontró el ID del estado "${value.status}".`
      });
      return;
    }

    if (!prioridad_id) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: `No se encontró el ID de la prioridad "${value.priority}". Pon sus IDs reales en priorityCatalog.`
      });
      return;
    }

    if (!this.editingTicketId) {
      this.ticketService.createTicket({
        grupo_id: this.groupId,
        titulo: value.title,
        descripcion: value.description,
        asignado_id: value.assignedTo || null,
        estado_id,
        prioridad_id,
        fecha_limite: value.dueDate || null
      }).subscribe({
        next: () => {
          this.dialogVisible = false;
          this.msg.add({
            severity: 'success',
            summary: 'Creado',
            detail: 'Ticket creado correctamente.'
          });
          this.loadTicketsByGroup();
        },
        error: (error) => {
          console.error('Error al crear ticket:', error);
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo crear el ticket.'
          });
        }
      });

      return;
    }

    const ticket = this.tickets.find(t => t.id === this.editingTicketId);
    if (!ticket) return;

    const update$ = this.ticketService.updateTicket(ticket.id, {
      titulo: value.title,
      descripcion: value.description,
      asignado_id: value.assignedTo || null,
      prioridad_id,
      fecha_limite: value.dueDate || null
    });

    const statusChanged = value.status !== ticket.estado;

    if (statusChanged) {
      forkJoin([
        update$,
        this.ticketService.changeTicketStatus(ticket.id, {
          estado_id,
          fecha_final: value.status === 'Resuelto' ? new Date().toISOString() : null
        })
      ]).subscribe({
        next: () => {
          this.dialogVisible = false;
          this.editingTicketId = null;
          this.msg.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Ticket actualizado correctamente.'
          });
          this.loadTicketsByGroup();
        },
        error: (error) => {
          console.error('Error al actualizar ticket:', error);
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el ticket.'
          });
        }
      });
    } else {
      update$.subscribe({
        next: () => {
          this.dialogVisible = false;
          this.editingTicketId = null;
          this.msg.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Ticket actualizado correctamente.'
          });
          this.loadTicketsByGroup();
        },
        error: (error) => {
          console.error('Error al actualizar ticket:', error);
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el ticket.'
          });
        }
      });
    }
  }

  saveTicketDetail(): void {
    if (!this.selectedTicket) return;

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
      status: string;
      assignedTo: string;
      priority: string;
      dueDate: string;
      comment: string;
    };

    const estado_id = this.statusCatalog[value.status];
    const prioridad_id = this.priorityCatalog[value.priority];

    if (!estado_id) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: `No se encontró el ID del estado "${value.status}".`
      });
      return;
    }

    if (this.canEditAllTicketFields) {
      const update$ = this.ticketService.updateTicket(this.selectedTicket.id, {
        titulo: value.title,
        descripcion: value.description,
        asignado_id: value.assignedTo || null,
        prioridad_id,
        fecha_limite: value.dueDate || null
      });

      const statusChanged = value.status !== this.selectedTicket.estado;

      if (statusChanged) {
        forkJoin([
          update$,
          this.ticketService.changeTicketStatus(this.selectedTicket.id, {
            estado_id,
            fecha_final: value.status === 'Resuelto' ? new Date().toISOString() : null
          })
        ]).subscribe({
          next: () => {
            this.detailDialogVisible = false;
            this.selectedTicket = null;
            this.msg.add({
              severity: 'success',
              summary: 'Actualizado',
              detail: 'Ticket actualizado correctamente.'
            });
            this.loadTicketsByGroup();
          },
          error: (error) => {
            console.error('Error al guardar detalle:', error);
            this.msg.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar el ticket.'
            });
          }
        });
      } else {
        update$.subscribe({
          next: () => {
            this.detailDialogVisible = false;
            this.selectedTicket = null;
            this.msg.add({
              severity: 'success',
              summary: 'Actualizado',
              detail: 'Ticket actualizado correctamente.'
            });
            this.loadTicketsByGroup();
          },
          error: (error) => {
            console.error('Error al guardar detalle:', error);
            this.msg.add({
              severity: 'error',
              summary: 'Error',
              detail: 'No se pudo actualizar el ticket.'
            });
          }
        });
      }

      return;
    }

    if (this.canOnlyEditStatusAndComment) {
      this.ticketService.changeTicketStatus(this.selectedTicket.id, {
        estado_id,
        fecha_final: value.status === 'Resuelto' ? new Date().toISOString() : null
      }).subscribe({
        next: () => {
          this.detailDialogVisible = false;
          this.selectedTicket = null;
          this.msg.add({
            severity: 'success',
            summary: 'Actualizado',
            detail: 'Estado del ticket actualizado correctamente.'
          });
          this.loadTicketsByGroup();
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.msg.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No se pudo actualizar el estado del ticket.'
          });
        }
      });

      return;
    }

    this.msg.add({
      severity: 'warn',
      summary: 'Sin permiso',
      detail: 'No tienes permiso para editar este ticket.'
    });
  }

  dropTicket(event: CdkDragDrop<Ticket[]>, newStatus: string): void {
    if (event.previousContainer === event.container) {
      return;
    }

    const movedTicket = event.previousContainer.data[event.previousIndex];
    if (!movedTicket) return;

    const estado_id = this.statusCatalog[newStatus];

    if (!estado_id) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: `No se encontró el estado "${newStatus}".`
      });
      return;
    }

    this.ticketService.changeTicketStatus(movedTicket.id, {
      estado_id,
      fecha_final: newStatus === 'Resuelto' ? new Date().toISOString() : null
    }).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Actualizado',
          detail: `El ticket se movió a "${newStatus}".`
        });
        this.loadTicketsByGroup();
      },
      error: (error) => {
        console.error('Error al mover ticket:', error);
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo actualizar el estado del ticket.'
        });
      }
    });
  }

  deleteTicket(ticketId: string): void {
    this.ticketService.deleteTicket(ticketId).subscribe({
      next: () => {
        this.msg.add({
          severity: 'success',
          summary: 'Eliminado',
          detail: 'Ticket eliminado correctamente.'
        });
        this.loadTicketsByGroup();
      },
      error: (error) => {
        console.error('Error al eliminar ticket:', error);
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: 'No se pudo eliminar el ticket.'
        });
      }
    });
  }
}