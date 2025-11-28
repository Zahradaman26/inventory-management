import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  tap,
  catchError,
  throwError,
  map,
} from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class VenuesService {
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getVenues(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/venues`).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  getVenueById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/venues/${id}`).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  addVenue(data: any): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/venues`, data, this.httpOptions)
      .pipe(
        map((response) => response),
        catchError(this.errorHandler)
      );
  }

  updateVenue(id: string, data: any): Observable<any> {
    return this.http
      .put<any>(`${this.apiUrl}/venues/${id}`, data, this.httpOptions)
      .pipe(
        map((response) => response),
        catchError(this.errorHandler)
      );
  }

  deleteVenue(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/venues/${id}`).pipe(
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
