import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@env/environment';
import { PointOfSale } from '../models';

@Injectable({
  providedIn: 'root'
})
export class PointOfSaleService {
  private apiUrl = `${environment.apiUrl}/points-of-sale`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<PointOfSale[]> {
    return this.http.get<PointOfSale[]>(this.apiUrl);
  }
}
