import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrdersService {
  private readonly PRODUCTS_API_URL = `${environment.apiUrl}/orders`;

  constructor(
    private http: HttpClient, private pipe: DecimalPipe) {}

  getAllOrders(): Observable<any> {
    return this.http.get<any>(`${this.PRODUCTS_API_URL}`).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.errorHandler)
    );
  }

  getVenueUsers(userId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/venues`).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  getEvents(userId: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/events`).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  createUpdateOrder(
    payload: any,
    isEdit: boolean,
    orderId: string
  ): Observable<any> {
    if (isEdit && orderId) {
      // Update existing order
      return this.http
        .patch<any>(`${this.PRODUCTS_API_URL}/${orderId}`, payload)
        .pipe(
          map((response) => response),
          catchError(this.errorHandler)
        );
    } else {
      // Create new order
      return this.http.post<any>(`${this.PRODUCTS_API_URL}/create`, payload).pipe(
        map((response) => response),
        catchError(this.errorHandler)
      );
    }
  }

  approveOrder(orderId: string, venueId: string): Observable<any> {
    const payload = { venueId };
    return this.http.post<any>(`${this.PRODUCTS_API_URL}/${orderId}/approve`, {}).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  rejectOrder(orderId: string, rejectionReason: string): Observable<any> {
    return this.http.post<any>(`${this.PRODUCTS_API_URL}/${orderId}/reject`, {
      rejectionReason: rejectionReason
    }).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  issueOrder(orderId: string, venueId: string): Observable<any> {
    const payload = { venueId };
    return this.http.post<any>(`${this.PRODUCTS_API_URL}/${orderId}/issue`, {}).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  errorHandler(error: any) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = error.error.message;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    return throwError(() => errorMessage);
  }
}
