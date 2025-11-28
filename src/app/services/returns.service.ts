import { DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReturnsService {
  private readonly PRODUCTS_API_URL = `${environment.apiUrl}/returns`;

  constructor(private http: HttpClient, private pipe: DecimalPipe) {}

  getAllReturns(): Observable<any> {
    return this.http.get<any>(`${this.PRODUCTS_API_URL}/user/my-returns`).pipe(
      map((response) => {
        return response;
      }),
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
