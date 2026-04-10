import { Component } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DatePickerModule } from 'primeng/datepicker';
import { KeyFilterModule } from 'primeng/keyfilter';

import { MessageService } from 'primeng/api';
import { UserService } from '../../services/user.service';
import { ToastModule } from 'primeng/toast';

// Validador: contraseñas iguales
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const pass = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!pass || !confirm) return null;
  return pass === confirm ? null : { passwordMismatch: true };
}

// Validador: mayor de edad (>= 18)
function isAdult(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const birth = new Date(value);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;

  return age >= 18 ? null : { notAdult: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  providers: [MessageService],
  imports: [
    RouterLink,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    DatePickerModule,
    KeyFilterModule,
    CommonModule,
    ToastModule

  ],
  templateUrl: './register.html',
  styleUrls: ['./register.scss'],
})
export class Register {
  submitted = false;
  loading = false;

  private readonly PASSWORD_REGEX = /^(?=.*[!@#$%^&*]).{10,}$/;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private msg: MessageService,
    private userService: UserService,
    private router: Router
  ) {
    this.form = this.fb.group(
      {
        username: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        fullName: ['', [Validators.required]],
        address: ['', [Validators.required]],
        phone: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
        birthDate: [null, [Validators.required, isAdult]],
        password: ['', [Validators.required, Validators.pattern(this.PASSWORD_REGEX)]],
        confirmPassword: ['', [Validators.required]],
      },
      { validators: [passwordsMatch] }
    );
  }

  isInvalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }

  hasMismatch() {
    return !!this.form.errors?.['passwordMismatch'] && (this.submitted || this.form.touched);
  }

  register() {
    this.submitted = true;

    if (this.form.invalid) {
      this.msg.add({
        severity: 'error',
        summary: 'Formulario inválido',
        detail: 'Revisa los campos marcados.',
      });
      return;
    }

    const formValue = this.form.value;

    const payload = {
      username: formValue.username ?? '',
      email: formValue.email ?? '',
      nombre_completo: formValue.fullName ?? '',
      direccion: formValue.address ?? '',
      telefono: formValue.phone ?? '',
      fecha_nac: this.formatBirthDate(formValue.birthDate),
      password: formValue.password ?? '',
    };

    this.loading = true;

    this.userService.register(payload).subscribe({
      next: () => {
        this.loading = false;

        this.msg.add({
          severity: 'success',
          summary: 'Registro correcto',
          detail: 'Usuario registrado correctamente.',
        });

        this.form.reset();
        this.submitted = false;

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1200);
      },
      error: (err) => {
        this.loading = false;
        console.error(err);

        this.msg.add({
          severity: 'error',
          summary: 'Error al registrar',
          detail: err?.error?.message || 'No se pudo registrar el usuario.',
        });
      }
    });
  }

  private formatBirthDate(value: any): string {
    if (!value) return '';

    const date = new Date(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}