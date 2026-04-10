import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RegisterUserDto {
  username: string;
  email: string;
  nombre_completo: string;
  direccion: string;
  telefono: string;
  fecha_nac: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);

  // 🔥 CAMBIO CLAVE
  private baseUrl = environment.auth;

  // 🔐 REGISTER
  register(data: RegisterUserDto): Observable<any> {
    return this.http.post(`${this.baseUrl}/register`, data);
  }

  // 🔐 LOGIN
  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/login`, { email, password });
  }

  // 👤 USERS
  getById(id: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  updateProfile(id: string, data: {
    username: string;
    email: string;
    nombre_completo: string;
    direccion: string;
    telefono: string;
    fecha_nac: string;
    password?: string;
  }): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

    deleteUser(id: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${id}`);
  }
}