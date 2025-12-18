import { Injectable, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError, map, of } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { VendorApiResponse, VendorItem, State, SearchResult } from '../interfaces/vendors.model';
import { SortColumn, SortDirection } from '../vendors/vendor-sortable.directive';
import { environment } from '../../environments/environment';

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;

function sort(vendors: VendorItem[], column: string, direction: string): VendorItem[] {
    if (direction === '' || column === '') return vendors;
    return [...vendors].sort((a: any, b: any) => {
        const res = compare(a[column]!, b[column]!);
        return direction === 'asc' ? res : -res;
    });
}

function matches(vendor: VendorItem, term: string) {
    const searchTerm = term.toLowerCase();
    return (
        vendor.name.toLowerCase().includes(searchTerm) ||
        vendor.shopName.toLowerCase().includes(searchTerm) ||
        vendor.email.toLowerCase().includes(searchTerm) ||
        vendor.contactNumber.toLowerCase().includes(searchTerm)
    );
}


@Injectable({ providedIn: 'root' })
export class VendorService {
    private readonly VENDORS_API_URL = `${environment.apiUrl}/vendors`;

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

    constructor(private http: HttpClient) { }

    private _set(patch: Partial<State>) {
        Object.assign(this._state, patch);
    }

    getAllVendors(): Observable<VendorApiResponse> {
        return this.http.get<any>(this.VENDORS_API_URL).pipe(
            map(response => {
                return response;
            }),
            catchError(this.errorHandler)
        );
    }

    getVendorById(vendorId: string): Observable<VendorItem> {
        return this.http.get<any>(`${this.VENDORS_API_URL}/${vendorId}`).pipe(
            map(response => {
                if (response.success && response.data) {
                    const vendorData = response.data.vendor || response.data;
                    return vendorData as VendorItem;
                }
                throw new Error('Vendor not found');
            }),
            catchError(this.errorHandler)
        );
    }

    getVendorProducts(vendorId: string): Observable<any[]> {
        return this.http.get<any>(`${this.VENDORS_API_URL}/${vendorId}/products`).pipe(
            map(response => {
                // Adjust based on your API response structure
                if (response.success && response.data) {
                    return response.data.products || response.data || [];
                }
                return [];
            }),
            catchError(() => of([]))
        );
    }

    addVendor(vendorData: any): Observable<VendorItem> {
        return this.http.post<any>(`${this.VENDORS_API_URL}/create`, vendorData).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data;
                }
                throw new Error(response.error || 'Failed to add vendor');
            }),
            catchError(this.errorHandler)
        );
    }

    updateVendor(vendorId: string, vendorData: any): Observable<VendorItem> {
        return this.http.put<any>(`${this.VENDORS_API_URL}/${vendorId}`, vendorData).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data;
                }
                throw new Error(response.error || 'Failed to update vendor');
            }),
            catchError(this.errorHandler)
        );
    }

    updateVendorStatus(vendorId: string, isActive: boolean): Observable<any> {
        const payload = { isActive };
        return this.http.put<any>(`${this.VENDORS_API_URL}/${vendorId}`, payload).pipe(
            map(response => {
                if (response.success) {
                    return response.data || { message: 'Status updated successfully' };
                }
                throw new Error(response.error || 'Failed to update status');
            }),
            catchError(this.errorHandler)
        );
    }

    deleteVendor(vendorId: string): Observable<{status: string}> {
        return this.http.delete<any>(`${this.VENDORS_API_URL}/${vendorId}`).pipe(
            map(response => {
                if (response.success) {
                    return { status: 'success' };
                }
                return { status: response.status || 'failed' };
            }),
            catchError((error) => this.errorHandler(error))
        );
    }

    public _search(vendorList: Array<VendorItem> = []): Observable<SearchResult> {
        const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;

        let data = searchTerm ?
            vendorList.filter((item) => matches(item, searchTerm)) :
            vendorList;

        data = sort(data, sortColumn, sortDirection);

        const total = data.length;
        this.totalRecords = total;

        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, total);

        this._state.startIndex = total > 0 ? startIndex + 1 : 0;
        this._state.endIndex = total > 0 ? endIndex : 0;

        const paginatedVendors = data.slice(startIndex, endIndex);

        return of({
            data: paginatedVendors,
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
                    errorMessage = 'You do not have permission to access vendors';
                    break;
                case 404:
                    errorMessage = 'Vendors not found';
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
