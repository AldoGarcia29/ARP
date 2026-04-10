import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { PermissionService } from '../../services/permission.service';
import { ToastModule } from 'primeng/toast';

const CURRENT_USER_KEY = 'arp_current_user';
const CURRENT_PERMISSIONS_KEY = 'arp_current_permissions';
const GLOBAL_PERMISSIONS_KEY = 'arp_global_permissions';
const GROUP_PERMISSIONS_KEY = 'arp_group_permissions';
const TOKEN_KEY = 'arp_token';
const IS_LOGGED_IN_KEY = 'isLoggedIn';

interface LoginResponse {
  statusCode: number;
  intOpCode?: string;
  message?: string;
  data: Array<{
    message?: string;
    token: string;
    user: {
      id: string;
      username?: string;
      email: string;
      nombre_completo?: string;
      fullName?: string;
      is_admin?: boolean;
    };
    permissions?: string[];
    globalPermissions?: string[];
    groupPermissions?: Array<{
      grupo_id?: string;
      group_id?: string;
      groupId?: string;
      permissions: string[];
    }>;
  }>;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    RouterLink,
    ReactiveFormsModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    CommonModule,
    ToastModule
  ],
  providers: [MessageService],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  submitted = false;
  loading = false;
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private msg: MessageService,
    private router: Router,
    private userService: UserService,
    private permissionService: PermissionService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }

  isInvalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.touched || this.submitted);
  }

  login(): void {
    this.submitted = true;

    if (this.form.invalid) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Completa los campos correctamente.'
      });
      return;
    }

    const email = this.form.value.email!;
    const password = this.form.value.password!;

    this.loading = true;

    this.userService.login(email, password).subscribe({
  next: (response: LoginResponse) => {
    this.loading = false;

    const data = response.data?.[0];

    if (!data) {
      this.msg.add({
        severity: 'error',
        summary: 'Error',
        detail: 'La respuesta del servidor no contiene datos válidos.'
      });
      return;
    }

    localStorage.setItem(IS_LOGGED_IN_KEY, 'true');
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(data.user));

    const permissions = data.permissions ?? data.globalPermissions ?? [];

    localStorage.setItem(CURRENT_PERMISSIONS_KEY, JSON.stringify(permissions));
    localStorage.setItem(GLOBAL_PERMISSIONS_KEY, JSON.stringify(data.globalPermissions || []));
    localStorage.setItem(GROUP_PERMISSIONS_KEY, JSON.stringify(data.groupPermissions || []));

    this.permissionService.reloadPermissions();
    this.permissionService.clearGroupPermissions();

    this.msg.add({
      severity: 'success',
      summary: 'Bienvenido',
      detail: data.message || response.message || 'Has iniciado sesión correctamente.'
    });

    setTimeout(() => {
      this.router.navigateByUrl('/home');
    }, 1000);
  },
  error: (err) => {
    this.loading = false;

    localStorage.removeItem(IS_LOGGED_IN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(CURRENT_PERMISSIONS_KEY);
    localStorage.removeItem(GLOBAL_PERMISSIONS_KEY);
    localStorage.removeItem(GROUP_PERMISSIONS_KEY);

    this.permissionService.reloadPermissions();
    this.permissionService.clearGroupPermissions();

    this.msg.add({
      severity: 'error',
      summary: 'Credenciales inválidas',
      detail: err?.error?.message || 'Correo o contraseña incorrectos.'
    });
  }
});
  }
}