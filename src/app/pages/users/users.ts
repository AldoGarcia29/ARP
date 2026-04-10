import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { UserService } from '../../services/user.service';
import { environment } from '../../../environments/environment';

type Ticket = {
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
};

type ProfileUser = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  address: string;
  phone: string;
  birthDate: string;
};

const CURRENT_USER_KEY = 'arp_current_user';

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
  private fb = inject(FormBuilder);
  private msg = inject(MessageService);
  private userService = inject(UserService);
  private http = inject(HttpClient);

  submitted = false;
  editing = false;
  loading = false;
  loadingTickets = false;

  currentUser: ProfileUser | null = null;
  currentUserId: string | null = null;
  tickets: Ticket[] = [];

  form: FormGroup = this.fb.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    fullName: ['', Validators.required],
    address: ['', Validators.required],
    phone: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    birthDate: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadCurrentUserId();

    if (this.currentUserId) {
      this.loadProfileFromApi();
    }

    this.loadTickets();
    this.form.disable();
  }

  private loadCurrentUserId(): void {
    const raw = localStorage.getItem(CURRENT_USER_KEY);

    if (!raw) {
      this.currentUserId = null;
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      this.currentUserId =
        parsed?.id ??
        parsed?.user?.id ??
        null;
    } catch {
      this.currentUserId = null;
    }
  }

  private loadProfileFromApi(): void {
    if (!this.currentUserId) return;

    this.loading = true;

    this.userService.getById(this.currentUserId).subscribe({
      next: (response) => {
        this.loading = false;

        const user = response.data;

        this.currentUser = {
          id: String(user.id),
          username: user.username ?? '',
          email: user.email ?? '',
          fullName: user.nombre_completo ?? user.fullName ?? '',
          address: user.direccion ?? '',
          phone: user.telefono ?? '',
          birthDate: user.fecha_nac ? String(user.fecha_nac).substring(0, 10) : ''
        };

        this.form.patchValue({
          username: this.currentUser.username,
          email: this.currentUser.email,
          password: '',
          fullName: this.currentUser.fullName,
          address: this.currentUser.address,
          phone: this.currentUser.phone,
          birthDate: this.currentUser.birthDate
        });

        const currentSessionRaw = localStorage.getItem(CURRENT_USER_KEY);
        if (currentSessionRaw) {
          try {
            const sessionUser = JSON.parse(currentSessionRaw);
            sessionUser.id = this.currentUser.id;
            sessionUser.username = this.currentUser.username;
            sessionUser.email = this.currentUser.email;
            sessionUser.nombre_completo = this.currentUser.fullName;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
          } catch {}
        }
      },
      error: (err) => {
        console.error('Error al cargar perfil:', err);
        this.loading = false;
        this.currentUser = null;

        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo cargar el perfil.'
        });
      }
    });
  }

  private loadTickets(): void {
    this.loadingTickets = true;

    this.http.get<any>(environment.tickets).subscribe({
      next: (resp) => {
        console.log('PROFILE TICKETS BACKEND:', resp);

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
          assignedUserId: t.asignado_id ? String(t.asignado_id) : null,
          priority: t.prioridad_nombre ?? t.priority ?? 'Media',
          createdAt: t.creado_en ?? t.createdAt ?? '',
          dueDate: t.fecha_limite ?? t.dueDate ?? '',
          comments: Array.isArray(t.comments) ? t.comments : [],
          groupId: String(t.grupo_id ?? t.group_id ?? t.groupId ?? '')
        }));

        this.loadingTickets = false;
      },
      error: (err) => {
        console.error('Error al cargar tickets del perfil:', err);
        this.tickets = [];
        this.loadingTickets = false;
      }
    });
  }

  get assignedTickets(): Ticket[] {
    if (!this.currentUser) return [];

    return this.tickets.filter(ticket =>
      ticket.assignedUserId === this.currentUser!.id
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

    if (this.currentUser) {
      this.form.patchValue({
        username: this.currentUser.username,
        email: this.currentUser.email,
        password: '',
        fullName: this.currentUser.fullName,
        address: this.currentUser.address,
        phone: this.currentUser.phone,
        birthDate: this.currentUser.birthDate
      });
    }

    this.form.disable();
  }

  saveChanges(): void {
    this.submitted = true;

    if (this.form.invalid || !this.currentUserId) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Completa los campos correctamente.',
      });
      return;
    }

    const formValue = this.form.getRawValue();

    const payload = {
      username: formValue.username,
      email: formValue.email,
      nombre_completo: formValue.fullName,
      direccion: formValue.address,
      telefono: formValue.phone,
      fecha_nac: formValue.birthDate,
      password: formValue.password?.trim() ? formValue.password : undefined
    };

    this.userService.updateProfile(this.currentUserId, payload).subscribe({
      next: (response) => {
        const updated = response.data;

        this.currentUser = {
          id: String(updated.id),
          username: updated.username,
          email: updated.email,
          fullName: updated.nombre_completo,
          address: updated.direccion,
          phone: updated.telefono,
          birthDate: updated.fecha_nac ? String(updated.fecha_nac).substring(0, 10) : ''
        };

        const currentSessionRaw = localStorage.getItem(CURRENT_USER_KEY);
        if (currentSessionRaw) {
          try {
            const sessionUser = JSON.parse(currentSessionRaw);
            sessionUser.id = this.currentUser.id;
            sessionUser.username = this.currentUser.username;
            sessionUser.email = this.currentUser.email;
            sessionUser.nombre_completo = this.currentUser.fullName;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(sessionUser));
          } catch {}
        }

        this.form.patchValue({
          username: this.currentUser.username,
          email: this.currentUser.email,
          password: '',
          fullName: this.currentUser.fullName,
          address: this.currentUser.address,
          phone: this.currentUser.phone,
          birthDate: this.currentUser.birthDate
        });

        this.msg.add({
          severity: 'success',
          summary: 'Guardado',
          detail: 'Perfil actualizado correctamente.',
        });

        this.editing = false;
        this.form.disable();
      },
      error: (err) => {
        console.error('Error al actualizar perfil:', err);
        this.msg.add({
          severity: 'error',
          summary: 'Error',
          detail: err?.error?.message || 'No se pudo actualizar el perfil.'
        });
      }
    });
  }

  deleteProfile(): void {
  if (!this.currentUserId) {
    this.msg.add({
      severity: 'error',
      summary: 'Error',
      detail: 'No se encontró el usuario actual.'
    });
    return;
  }

  const confirmed = confirm('¿Seguro que deseas eliminar tu perfil? Esta acción no se puede deshacer.');

  if (!confirmed) {
    return;
  }

  this.userService.deleteUser(this.currentUserId).subscribe({
    next: () => {
      localStorage.removeItem('arp_current_user');
      localStorage.removeItem('arp_global_permissions');
      localStorage.removeItem('arp_group_permissions');
      localStorage.removeItem('arp_current_permissions');
      localStorage.removeItem('token');

      this.msg.add({
        severity: 'success',
        summary: 'Eliminado',
        detail: 'Tu perfil fue eliminado correctamente.'
      });

      setTimeout(() => {
        window.location.href = '/login';
      }, 800);
    },
    error: (err) => {
      console.error('Error al eliminar perfil:', err);
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: err?.error?.message || 'No se pudo eliminar el perfil.'
      });
    }
  });
}

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }
}