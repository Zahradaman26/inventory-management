import { Injectable, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map, of } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { PurchaseOrder, PurchaseOrderApiResponse, PurchaseOrderStatistics, SearchResult, State } from '../interfaces/purchase-order.model';
import { environment } from '../../environments/environment';

const compare = (v1: string | number | Date, v2: string | number | Date) => {
  if (v1 instanceof Date && v2 instanceof Date) {
    return v1.getTime() < v2.getTime() ? -1 : v1.getTime() > v2.getTime() ? 1 : 0;
  }
  return v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
};

function sort(purchaseOrders: PurchaseOrder[], column: string, direction: string): PurchaseOrder[] {
  if (direction === '' || column === '') return purchaseOrders;
  return [...purchaseOrders].sort((a: any, b: any) => {
    const res = compare(a[column]!, b[column]!);
    return direction === 'asc' ? res : -res;
  });
}

function matches(purchaseOrder: PurchaseOrder, term: string, pipe: PipeTransform) {
  const searchTerm = term.toLowerCase();
  return (
    purchaseOrder.poNumber.toLowerCase().includes(searchTerm) ||
    (purchaseOrder.vendorId?.name?.toLowerCase()?.includes(searchTerm)) ||
    purchaseOrder.status.toLowerCase().includes(searchTerm) ||
    (purchaseOrder.vendorId?.shopName?.toLowerCase()?.includes(searchTerm)) ||
    purchaseOrder.items.some(item => 
      item.productId?.name?.toLowerCase()?.includes(searchTerm) ||
      item.productId?.SKU?.toLowerCase()?.includes(searchTerm)
    )
  );
}

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  
  private readonly PURCHASE_ORDERS_API_URL = `${environment.apiUrl}/purchase-orders`;

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

  // Get all purchase orders
  getAllPurchaseOrders(): Observable<PurchaseOrderApiResponse> {
    return this.http.get<PurchaseOrderApiResponse>(this.PURCHASE_ORDERS_API_URL).pipe(
      map(response => {
        if (response.data && Array.isArray(response.data.purchaseOrders)) {
          response.data.purchaseOrders = response.data.purchaseOrders.map((po: any) => ({
            ...po,
            createdAt: new Date(po.createdAt),
            updatedAt: new Date(po.updatedAt),
            expectedDeliveryDate: po.expectedDeliveryDate ? new Date(po.expectedDeliveryDate) : undefined,
            actualDeliveryDate: po.actualDeliveryDate ? new Date(po.actualDeliveryDate) : undefined,
            approvedAt: po.approvedAt ? new Date(po.approvedAt) : undefined,
            receivedAt: po.receivedAt ? new Date(po.receivedAt) : undefined
          }));
        }
        return response;
      }),
      catchError(this.errorHandler)
    );
  }

  // Get single purchase order by ID
  getPurchaseOrderById(purchaseOrderId: string): Observable<PurchaseOrder> {
    return this.http.get<any>(`${this.PURCHASE_ORDERS_API_URL}/${purchaseOrderId}`).pipe(
      map(response => {
        if (response.success && response.data) {
          const poData = response.data.purchaseOrder || response.data;
          return {
            ...poData,
            createdAt: new Date(poData.createdAt),
            updatedAt: new Date(poData.updatedAt),
            expectedDeliveryDate: poData.expectedDeliveryDate ? new Date(poData.expectedDeliveryDate) : undefined,
            actualDeliveryDate: poData.actualDeliveryDate ? new Date(poData.actualDeliveryDate) : undefined,
            approvedAt: poData.approvedAt ? new Date(poData.approvedAt) : undefined,
            receivedAt: poData.receivedAt ? new Date(poData.receivedAt) : undefined
          } as PurchaseOrder;
        }
        throw new Error('Purchase order not found');
      }),
      catchError(this.errorHandler)
    );
  }

  // Create new purchase order
  createPurchaseOrder(purchaseOrderData: any): Observable<PurchaseOrder> {
    return this.http.post<any>(this.PURCHASE_ORDERS_API_URL, purchaseOrderData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.purchaseOrder;
        }
        throw new Error(response.error || 'Failed to create purchase order');
      }),
      catchError(this.errorHandler)
    );
  }

  // Update purchase order (only draft status)
  updatePurchaseOrder(purchaseOrderId: string, purchaseOrderData: any): Observable<PurchaseOrder> {
    return this.http.put<any>(`${this.PURCHASE_ORDERS_API_URL}/${purchaseOrderId}`, purchaseOrderData).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.purchaseOrder;
        }
        throw new Error(response.error || 'Failed to update purchase order');
      }),
      catchError(this.errorHandler)
    );
  }

  // Submit purchase order for approval
  submitForApproval(purchaseOrderId: string): Observable<any> {
    return this.http.patch<any>(`${this.PURCHASE_ORDERS_API_URL}/${purchaseOrderId}/submit`, {}).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Purchase order submitted for approval' };
        }
        throw new Error(response.error || 'Failed to submit purchase order');
      }),
      catchError(this.errorHandler)
    );
  }

  // Approve purchase order
  approvePurchaseOrder(purchaseOrderId: string, notes?: string): Observable<any> {
    const body = notes ? { notes } : {};
    return this.http.patch<any>(`${this.PURCHASE_ORDERS_API_URL}/${purchaseOrderId}/approve`, body).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Purchase order approved' };
        }
        throw new Error(response.error || 'Failed to approve purchase order');
      }),
      catchError(this.errorHandler)
    );
  }

  // Reject purchase order
  rejectPurchaseOrder(purchaseOrderId: string, rejectionReason?: string): Observable<any> {
    const body = rejectionReason ? { rejectionReason } : {};
    return this.http.patch<any>(`${this.PURCHASE_ORDERS_API_URL}/${purchaseOrderId}/reject`, body).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Purchase order rejected' };
        }
        throw new Error(response.error || 'Failed to reject purchase order');
      }),
      catchError(this.errorHandler)
    );
  }

  // Mark as ordered
  markAsOrdered(purchaseOrderId: string, notes?: string): Observable<any> {
    const body = notes ? { notes } : {};
    return this.http.patch<any>(`${this.PURCHASE_ORDERS_API_URL}/${purchaseOrderId}/mark-ordered`, body).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Purchase order marked as ordered' };
        }
        throw new Error(response.error || 'Failed to mark purchase order as ordered');
      }),
      catchError(this.errorHandler)
    );
  }

  // Cancel purchase order
  cancelPurchaseOrder(purchaseOrderId: string, cancellationReason?: string): Observable<any> {
    const body = cancellationReason ? { cancellationReason } : {};
    return this.http.patch<any>(`${this.PURCHASE_ORDERS_API_URL}/${purchaseOrderId}/cancel`, body).pipe(
      map(response => {
        if (response.success) {
          return response.data || { message: 'Purchase order cancelled' };
        }
        throw new Error(response.error || 'Failed to cancel purchase order');
      }),
      catchError(this.errorHandler)
    );
  }

  // Delete purchase order
  deletePurchaseOrder(purchaseOrderId: string): Observable<any> {
    return this.http.delete<any>(`${this.PURCHASE_ORDERS_API_URL}/${purchaseOrderId}`).pipe(
      map(response => {
        if (response.success || response.status === 'success' || response.message) {
          return response;
        }
        throw new Error('Invalid response format from server');
      }),
      catchError(this.errorHandler)
    );
  }

  // Get statistics
  getStatistics(timeframe: string = 'month'): Observable<PurchaseOrderStatistics> {
    return this.http.get<any>(`${this.PURCHASE_ORDERS_API_URL}/statistics?timeframe=${timeframe}`).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.statistics;
        }
        throw new Error('Failed to get statistics');
      }),
      catchError(this.errorHandler)
    );
  }

  // Search and filter
  public _search(purchaseOrderList: Array<PurchaseOrder> = []): Observable<SearchResult> {
    const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;

    // 1. Filter by search term
    let data = searchTerm ?
      purchaseOrderList.filter((item) => matches(item, searchTerm, this.pipe)) :
      purchaseOrderList;

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
    const paginatedPurchaseOrders = data.slice(startIndex, endIndex);

    return of({
      data: paginatedPurchaseOrders,
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
          errorMessage = 'You do not have permission to access purchase orders';
          break;
        case 404:
          errorMessage = 'Purchase order not found';
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