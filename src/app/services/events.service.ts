import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getEvents(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/events`).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  getEventById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/events/${id}`).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users`).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  addEvent(data: any): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/events`, data, this.httpOptions)
      .pipe(
        map((response) => response),
        catchError(this.errorHandler)
      );
  }

  updateEvent(id: string, data: any): Observable<any> {
    return this.http
      .put<any>(`${this.apiUrl}/events/${id}`, data, this.httpOptions)
      .pipe(
        map((response) => response),
        catchError(this.errorHandler)
      );
  }

  deleteEvent(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/events/${id}`).pipe(
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
