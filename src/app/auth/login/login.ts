import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  imports: [ RouterLink,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  //✅ Credenciales hardcodeadas
  private readonly VALID_EMAIL = 'admin@arp.com';
  private readonly VALID_PASSWORD = 'Admin@12345!';

  submitted = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private msg: MessageService,
    private router: Router
  ) { this.form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });}

  isInvalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }

  login() {
    this.submitted = true;

    if (this.form.invalid) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Completa los campos correctamente.',
      });
      return;
    }

    const email = this.form.value.email!;
    const password = this.form.value.password!;

    if (email === this.VALID_EMAIL && password === this.VALID_PASSWORD) {
      this.msg.add({
        severity: 'success',
        summary: 'Login correcto',
        detail: 'Bienvenido',
      });
    } else {
      this.msg.add({
        severity: 'error',
        summary: 'Credenciales inválidas',
        detail: 'Correo o contraseña incorrectos.',
      });
    }
  }

}
