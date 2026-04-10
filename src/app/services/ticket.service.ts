import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TicketApiResponse {
  statusCode: number;
  intOpCode: string;
  data: TicketApi[];
}

export interface TicketApi {
  id: string;
  grupo_id: string;
  titulo: string;
  descripcion: string;
  autor_id: string;
  asignado_id: string | null;
  estado_id: string;
  prioridad_id: string;
  creado_en: string;
  fecha_limite: string | null;
  fecha_final: string | null;

  grupo_nombre?: string;
  autor_username?: string;
  asignado_username?: string | null;
  estado_nombre?: string;
  prioridad_nombre?: string;
}

export interface TicketHistoryApi {
  id: string;
  ticket_id: string;
  usuario_id: string;
  accion: string;
  detalle: string;
  creado_en: string;
  username?: string;
  nombre_completo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private baseUrl = environment.tickets;

  getTicketsByGroup(groupId: string): Observable<TicketApiResponse> {
    return this.http.get<TicketApiResponse>(`${this.baseUrl}/group/${groupId}`);
  }

  getTicketById(ticketId: string): Observable<TicketApiResponse> {
    return this.http.get<TicketApiResponse>(`${this.baseUrl}/${ticketId}`);
  }

  createTicket(payload: {
    grupo_id: string;
    titulo: string;
    descripcion: string;
    asignado_id?: string | null;
    estado_id: string;
    prioridad_id: string;
    fecha_limite?: string | null;
  }): Observable<TicketApiResponse> {
    return this.http.post<TicketApiResponse>(this.baseUrl, payload);
  }

  updateTicket(
    ticketId: string,
    payload: {
      titulo?: string;
      descripcion?: string;
      asignado_id?: string | null;
      prioridad_id?: string;
      fecha_limite?: string | null;
    }
  ): Observable<TicketApiResponse> {
    return this.http.put<TicketApiResponse>(`${this.baseUrl}/${ticketId}`, payload);
  }

  changeTicketStatus(
    ticketId: string,
    payload: {
      estado_id: string;
      fecha_final?: string | null;
    }
  ): Observable<TicketApiResponse> {
    return this.http.patch<TicketApiResponse>(`${this.baseUrl}/${ticketId}/status`, payload);
  }

  assignTicket(
    ticketId: string,
    payload: {
      asignado_id: string | null;
    }
  ): Observable<TicketApiResponse> {
    return this.http.patch<TicketApiResponse>(`${this.baseUrl}/${ticketId}/assign`, payload);
  }

  deleteTicket(ticketId: string): Observable<TicketApiResponse> {
    return this.http.delete<TicketApiResponse>(`${this.baseUrl}/${ticketId}`);
  }


  getTicketHistory(ticketId: string) {
  return this.http.get<{
    statusCode: number;
    intOpCode: string;
    data: TicketHistoryApi[];
  }>(`${this.baseUrl}/${ticketId}/history`);
}
}