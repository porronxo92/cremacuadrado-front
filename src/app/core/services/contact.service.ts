import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { BotCheckPayload } from '../../shared/components/bot-check/bot-check.component';

export interface ContactFormPayload extends BotCheckPayload {
  name: string;
  email: string;
  message: string;
  accepts_marketing: boolean;
  accept_privacy: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/contact`;

  constructor(private http: HttpClient) {}

  submit(payload: ContactFormPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/submit`, payload);
  }
}
