import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';

export interface PosLeadPayload {
  name: string;
  establishment_name: string;
  city: string;
  establishment_type: string;
  email: string;
  phone: string;
}

@Injectable({
  providedIn: 'root'
})
export class ParaTiendasService {
  private apiUrl = `${environment.apiUrl}/leads`;

  constructor(private http: HttpClient) {}

  submitPosLead(payload: PosLeadPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/punto-de-venta`, payload);
  }
}
