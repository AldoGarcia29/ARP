import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

type Profile = {
  username: string;
  email: string;
  fullName: string;
  password: string;
  address: string;
  phone: string;
  birthDate: string;
};

const KEY = 'arp_profile';

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
  submitted = false;
  editing = false;

  // ✅ Datos demo (los tuyos)
  profile: Profile = {
    username: 'Aldo Garcia',
    email: 'aldopro@gmail.com',
    fullName: 'Aldo Jair Garcia Pacheco',
    password: 'Admin@12345!',
    address: 'Avenida de la Luz',
    phone: '4423936181',
    birthDate: '29-Enero-2005',
  };

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private msg: MessageService
  ) {
    this.form = this.fb.group({
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      fullName: ['', Validators.required],
      address: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      birthDate: ['', Validators.required],
    });
  }


  ngOnInit(): void {
    // 1) Cargar de localStorage si existe, si no guardar el demo
    const saved = this.getProfile();
    if (saved) this.profile = saved;
    else this.saveProfile(this.profile);

    // 2) Cargar a form y bloquear edición
    this.form.patchValue(this.profile);
    this.form.disable();
  }

  // ---------- R (Read) ----------
  private getProfile(): Profile | null {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Profile;
    } catch {
      return null;
    }
  }

  // ---------- U (Update) ----------
  startEdit() {
    this.editing = true;
    this.submitted = false;
    this.form.enable();
  }

  cancelEdit() {
    this.editing = false;
    this.submitted = false;
    this.form.patchValue(this.profile);
    this.form.disable();
  }

  saveChanges() {
    this.submitted = true;

    if (this.form.invalid) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Completa los campos correctamente.',
      });
      return;
    }

    const updated = this.form.getRawValue() as Profile;

    // Actualiza en memoria + localStorage
    this.profile = updated;
    this.saveProfile(updated);

    this.msg.add({
      severity: 'success',
      summary: 'Guardado',
      detail: 'Perfil actualizado.',
    });

    this.editing = false;
    this.form.disable();
  }

  private saveProfile(p: Profile) {
    localStorage.setItem(KEY, JSON.stringify(p));
  }

  // ---------- D (Delete) ----------
  deleteProfile() {
    localStorage.removeItem(KEY);

    // Dejas el demo o vacías (yo dejo demo para que no quede vacío)
    this.profile = {
      username: '',
      email: '',
      fullName: '',
      password: '',
      address: '',
      phone: '',
      birthDate: '',
    };

    this.form.reset(this.profile);
    this.form.disable();
    this.editing = false;

    this.msg.add({
      severity: 'warn',
      summary: 'Eliminado',
      detail: 'Perfil eliminado.',
    });
  }

  isInvalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }
}