import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageModule } from 'primeng/message';

import { MessageService, ConfirmationService } from 'primeng/api';

type Level = 'Beginner' | 'Intermediate' | 'Advanced';

type GroupModel = {
  id: number;
  level: Level;
  author: string;
  name: string;
  members: number;
  tickets: number;
  description: string;
};

const KEY = 'arp_groups';

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
    InputNumberModule,
    SelectModule,
    ToastModule,
    ConfirmDialogModule,
    MessageModule,
  ],
  providers: [MessageService, ConfirmationService],
})
export class Group implements OnInit {
  groups: GroupModel[] = [];

  levels = [
    { label: 'Beginner', value: 'Beginner' as const },
    { label: 'Intermediate', value: 'Intermediate' as const },
    { label: 'Advanced', value: 'Advanced' as const },
  ];

  dialogVisible = false;
  submitted = false;
  editingId: number | null = null;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private msg: MessageService,
    private confirm: ConfirmationService
  ) {
    this.form = this.fb.group({
      level: ['Beginner', Validators.required],
      author: ['', Validators.required],
      name: ['', Validators.required],
      members: [1, [Validators.required, Validators.min(1)]],
      tickets: [0, [Validators.required, Validators.min(0)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  ngOnInit(): void {
    // Cargar de localStorage o meter demo
    const saved = this.getGroups();
    if (saved && saved.length) this.groups = saved;
    else {
      this.groups = [
        {
          id: 1,
          level: 'Beginner',
          author: 'Aldo Garcia',
          name: 'ARP Starter',
          members: 10,
          tickets: 3,
          description: 'Grupo de práctica inicial.',
        },
        {
          id: 2,
          level: 'Advanced',
          author: 'Fernanda',
          name: 'ARP Advanced',
          members: 24,
          tickets: 8,
          description: 'Seguimiento avanzado de tickets y métricas.',
        },
      ];
      this.saveGroups();
    }
  }

  // ---------- Storage ----------
  private getGroups(): GroupModel[] | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as GroupModel[];
    } catch {
      return null;
    }
  }

  private saveGroups() {
    localStorage.setItem(KEY, JSON.stringify(this.groups));
  }

  // ---------- UI helpers ----------
  get total(): number {
    return this.groups.length;
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

  // ---------- Create ----------
  openNew() {
    this.submitted = false;
    this.editingId = null;

    this.form.reset({
      level: 'Beginner',
      author: '',
      name: '',
      members: 1,
      tickets: 0,
      description: '',
    });

    this.dialogVisible = true;
  }

  // ---------- Update ----------
  editGroup(g: GroupModel) {
    this.submitted = false;
    this.editingId = g.id;

    this.form.setValue({
      level: g.level,
      author: g.author,
      name: g.name,
      members: g.members,
      tickets: g.tickets,
      description: g.description,
    });

    this.dialogVisible = true;
  }

  // ---------- Save (Create/Update) ----------
  save() {
    this.submitted = true;

    if (this.form.invalid) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Completa el formulario correctamente.',
      });
      return;
    }

    const v = this.form.getRawValue();

    if (this.editingId === null) {
      // CREATE
      const newId = this.groups.length ? Math.max(...this.groups.map(x => x.id)) + 1 : 1;

      const created: GroupModel = {
        id: newId,
        level: v.level,
        author: v.author,
        name: v.name,
        members: v.members,
        tickets: v.tickets,
        description: v.description,
      };

      this.groups = [created, ...this.groups];

      this.msg.add({
        severity: 'success',
        summary: 'Creado',
        detail: 'Group creado.',
      });
    } else {
      // UPDATE
      this.groups = this.groups.map(g =>
        g.id === this.editingId
          ? { id: g.id, ...v }
          : g
      );

      this.msg.add({
        severity: 'success',
        summary: 'Actualizado',
        detail: 'Group actualizado.',
      });
    }

    this.saveGroups();
    this.dialogVisible = false;
  }

  // ---------- Delete ----------
  deleteGroup(g: GroupModel) {
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
          detail: 'Group eliminado.',
        });
      },
    });
  }

  onDialogHide() {
    this.submitted = false;
    this.editingId = null;
  }
}