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
    return this.http.get<any>(`${this.PRODUCTS_API_URL}`).pipe(
      map((response) => {
        return response;
      }),
      catchError(this.errorHandler)
    );
  }

  // For fully returned items
  approveReturn(returnId: string): Observable<any> {
    return this.http.post<any>(`${this.PRODUCTS_API_URL}/${returnId}/approve`, {
      approvalType: 'full'
    }).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  // For partially returned items
  approvePartialReturn(returnId: string): Observable<any> {
    return this.http.post<any>(`${this.PRODUCTS_API_URL}/${returnId}/approve`, {
      approvalType: 'partial'
    }).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  rejectReturn(returnId: string, rejectionReason?: string): Observable<any> {
    const body = rejectionReason ? { rejectionReason } : {};
    return this.http.post<any>(`${this.PRODUCTS_API_URL}/${returnId}/reject`, body).pipe(
      map((response) => response),
      catchError(this.errorHandler)
    );
  }

  // Add this method to get combined status display
  getDisplayStatus(returnItem: any): string {
    if (returnItem.statusApproval === 'rejected') return 'Rejected';
    if (returnItem.statusApproval === 'approved') return 'Approved';
    if (returnItem.statusApproval === 'partiallyApproved') return 'Partially Approved';
    
    // If pending approval, show return status
    if (returnItem.statusApproval === 'pendingApproval') {
      switch(returnItem.statusReturn) {
        case 'pendingReturn': return 'Pending Return';
        case 'partiallyReturned': return 'Partially Returned';
        case 'fullyReturned': return 'Fully Returned';
        default: return 'Pending';
      }
    }
    
    return 'Pending';
  }

  getStatusBadgeClass(returnItem: any): string {
    if (returnItem.statusApproval === 'approved') return 'bg-success-focus text-success-main';
    if (returnItem.statusApproval === 'rejected') return 'bg-danger-focus text-danger-main';
    if (returnItem.statusApproval === 'partiallyApproved') return 'bg-warning-focus text-warning-main';
    
    // Pending approval - show return progress
    if (returnItem.statusApproval === 'pendingApproval') {
      if (returnItem.statusReturn === 'fullyReturned') return 'bg-info-focus text-info-main';
      if (returnItem.statusReturn === 'partiallyReturned') return 'bg-warning-focus text-warning-main';
      return 'bg-secondary-focus text-secondary-main';
    }
    
    return 'bg-secondary-focus text-secondary-main';
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