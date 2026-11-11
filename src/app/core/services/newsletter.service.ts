import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { BotCheckPayload } from '../../shared/components/bot-check/bot-check.component';

@Injectable({
  providedIn: 'root'
})
export class NewsletterService {
  private apiUrl = `${environment.apiUrl}/newsletter`;

  constructor(private http: HttpClient) {}

  /** Alta con doble opt-in: `consent` es la casilla de comunicaciones comerciales. */
  subscribe(email: string, consent: boolean, source: string, bot: BotCheckPayload): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/subscribe`, { email, consent, source, ...bot });
  }

  confirm(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/confirm`, { token });
  }

  unsubscribe(token: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.apiUrl}/unsubscribe`, { token });
  }
}
