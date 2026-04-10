import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface GroupUser {
  id: string;
  username: string;
  email: string;
  nombre_completo: string;
}

export interface GroupModel {
  id: string;
  nivel: 'Beginner' | 'Intermediate' | 'Advanced';
  autor: string;
  creador_id: string;
  nombre: string;
  descripcion: string;
  members?: GroupUser[];
  memberIds?: string[];
  ticketsCount?: number;
}

export interface GroupApiResponse {
  statusCode: number;
  intCode: number;
  data: any;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private http = inject(HttpClient);
private baseUrl = environment.groups;
  getAll() {
    return this.http.get<GroupApiResponse>(this.baseUrl);
  }

  create(payload: {
    nivel: string;
    creador_id: string;
    nombre: string;
    descripcion: string;
  }) {
    return this.http.post<GroupApiResponse>(this.baseUrl, payload);
  }

  update(groupId: string, payload: {
    nivel: string;
    nombre: string;
    descripcion: string;
  }) {
    return this.http.put<GroupApiResponse>(`${this.baseUrl}/${groupId}`, payload);
  }

  delete(groupId: string) {
    return this.http.delete<GroupApiResponse>(`${this.baseUrl}/${groupId}`);
  }

  addMember(groupId: string, usuarioId: string) {
    return this.http.post<GroupApiResponse>(`${this.baseUrl}/${groupId}/members`, {
      usuarioId
    });
  }

  removeMember(groupId: string, usuarioId: string) {
    return this.http.delete<GroupApiResponse>(`${this.baseUrl}/${groupId}/members/${usuarioId}`);
  }

  getGroupMembers(groupId: string) {
  return this.http.get<{
    statusCode: number;
    intOpCode: string;
    data: Array<{
      id: string;
      username?: string;
      email: string;
      nombre_completo?: string;
    }>;
  }>(`${environment.groups}/${groupId}/members`);
}
}