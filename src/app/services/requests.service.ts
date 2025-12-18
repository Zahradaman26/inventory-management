import { Injectable, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map, of } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { Request, RequestApiResponse, SearchResult, State } from '../interfaces/request.model';
import { environment } from '../../environments/environment';

const compare = (v1: string | number | Date, v2: string | number | Date) => {
  if (v1 instanceof Date && v2 instanceof Date) {
    return v1.getTime() < v2.getTime() ? -1 : v1.getTime() > v2.getTime() ? 1 : 0;
  }
  return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
};

function sort(requests: Request[], column: string, direction: string): Request[] {
  if (direction === '' || column === '') return requests;
  return [...requests].sort((a: any, b: any) => {
    const res = compare(a[column]!, b[column]!);
    return direction === 'asc' ? res : -res;
  });
}

function matches(request: Request, term: string, pipe: PipeTransform) {
  const searchTerm = term.toLowerCase();
  return (
    request.requestNumber.toLowerCase().includes(searchTerm) ||
    (request.vendorId?.name?.toLowerCase()?.includes(searchTerm)) ||
    request.status.toLowerCase().includes(searchTerm) ||
    request.items.some(item => 
      item.product?.name?.toLowerCase()?.includes(searchTerm) ||
      item.product?.SKU?.toLowerCase()?.includes(searchTerm)
    )
  );
}

@Injectable({ providedIn: 'root' })
export class RequestService {
  
  private readonly REQUESTS_API_URL = `${environment.apiUrl}/requests`;

  private _state: State = {
    page: 1,
    pageSize: 10,
    searchTerm: '',
    sortColumn: '',
    sortDirection: '',
    startIndex: 0,
    endIndex: 9,
    totalRecords: 0,
  };

  get startIndex() { return this._state.startIndex; }
  get endIndex() { return this._state.endIndex; }
  get page() { return this._state.page; }
  set page(page: number) { this._set({ page }); }
  get pageSize() { return this._state.pageSize; }
  set pageSize(pageSize: number) { this._set({ pageSize }); }
  get searchTerm() { return this._state.searchTerm; }
  set searchTerm(searchTerm: string) { this._set({ searchTerm }); }
  get totalRecords() { return this._state.totalRecords; }
  set totalRecords(totalRecords: number) { this._set({ totalRecords }); }

  constructor(private http: HttpClient, private pipe: DecimalPipe) { }

  private _set(patch: Partial<State>) {
    Object.assign(this._state, patch);
  }

  // Get all requests
  getAllRequests(): Observable<RequestApiResponse> {
    return this.http.get<RequestApiResponse>(this.REQUESTS_API_URL).pipe(
      map(response => {
        if (response.data && Array.isArray(response.data.requests)) {
          response.data.requests = response.data.requests.map((request: any) => ({
            ...request,
            createdAt: new Date(request.createdAt),
            updatedAt: new Date(request.updatedAt)
          }));
        }
        return response;
      }),
      catchError(this.errorHandler)
    );
  }

  // Get single request by ID
  getRequestById(requestId: string): Observable<Request> {
    return this.http.get<any>(`${this.REQUESTS_API_URL}/${requestId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          const requestData = response.data.request || response.data;
          return requestData as Request;
        }
        throw new Error('Request not found');
      }),
      catchError(this.errorHandler)
    );
  }

  // Create new request
  createRequest(requestData: any): Observable<Request> {
    return this.http.post<any>(this.REQUESTS_API_URL, requestData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to create request');
      }),
      catchError(this.errorHandler)
    );
  }

  // Update request
  updateRequest(requestId: string, requestData: any): Observable<Request> {
    return this.http.put<any>(`${this.REQUESTS_API_URL}/${requestId}`, requestData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to update request');
      }),
      catchError(this.errorHandler)
    );
  }

  // assign vendor request - using the specific API endpoint
  assignVendorToRequest(requestId: string): Observable<any> {
    return this.http.post<any>(`${this.REQUESTS_API_URL}/${requestId}/assign-vendors`, {}).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Vendor assigned successfully' };
        }
        throw new Error(response.error || 'Failed to assign vendor');
      }),
      catchError(this.errorHandler)
    );
  }

  // Approve request - using the specific API endpoint
  approveRequest(requestId: string): Observable<any> {
    return this.http.post<any>(`${this.REQUESTS_API_URL}/${requestId}/approve`, {}).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Request approved successfully' };
        }
        throw new Error(response.error || 'Failed to approve request');
      }),
      catchError(this.errorHandler)
    );
  }

  // Reject request - using the specific API endpoint
  rejectRequest(requestId: string): Observable<any> {
    return this.http.post<any>(`${this.REQUESTS_API_URL}/${requestId}/reject`, {}).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Request rejected successfully' };
        }
        throw new Error(response.error || 'Failed to reject request');
      }),
      catchError(this.errorHandler)
    );
  }

  // Complete request - using the specific API endpoint
  completeRequest(requestId: string): Observable<any> {
    return this.http.post<any>(`${this.REQUESTS_API_URL}/${requestId}/complete`, {}).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Request completed successfully' };
        }
        throw new Error(response.error || 'Failed to complete request');
      }),
      catchError(this.errorHandler)
    );
  }

  // Delete request
  deleteRequest(requestId: string): Observable<any> {
    return this.http.delete<any>(`${this.REQUESTS_API_URL}/${requestId}`).pipe(
      map(response => {
        if (response.success || response.status === 'success' || response.message) {
          return response;
        }
        throw new Error('Invalid response format from server');
      }),
      catchError(this.errorHandler)
    );
  }

  // Search and filter
  public _search(requestList: Array<Request> = []): Observable<SearchResult> {
    const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;

    // 1. Filter by search term
    let data = searchTerm ?
      requestList.filter((item) => matches(item, searchTerm, this.pipe)) :
      requestList;

    // 2. Sort
    data = sort(data, sortColumn, sortDirection);

    // 3. Update total records
    const total = data.length;
    this.totalRecords = total;

    // 4. Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);

    // 5. Update state indices
    this._state.startIndex = total > 0 ? startIndex + 1 : 0;
    this._state.endIndex = total > 0 ? endIndex : 0;

    // 6. Slice for current page
    const paginatedRequests = data.slice(startIndex, endIndex);

    return of({
      data: paginatedRequests,
      total: total
    });
  }

  private errorHandler(error: any) {
    let errorMessage = 'An unknown error occurred';

    if (typeof error === 'string') {
      errorMessage = error;
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else if (error.status) {
      switch (error.status) {
        case 401:
          errorMessage = 'Authentication failed. Please login again.';
          break;
        case 403:
          errorMessage = 'You do not have permission to access requests';
          break;
        case 404:
          errorMessage = 'Request not found';
          break;
        case 500:
          errorMessage = 'Server error - Please try again later';
          break;
        default:
          errorMessage = `Error ${error.status}: ${error.message || 'Unknown error'}`;
      }

      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => errorMessage);
  }
}