import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { WarehouseItem, WarehouseApiResponse } from '../interfaces/warehouse.model';

@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  private apiUrl = environment.apiUrl;
  private warehousesSubject = new BehaviorSubject<WarehouseItem[]>([]);
  public warehouses$ = this.warehousesSubject.asObservable();

  constructor(private http: HttpClient) {}

  // -----------------------------------------
  // GET WAREHOUSES
  // -----------------------------------------
  getWarehouses(page: number = 1, limit: number = 10, search: string = ''): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/warehouses`, this.httpOptions).pipe(
      map((response) => {
        let warehouses: WarehouseItem[] = [];

        if (response.success && response.data?.warehouses) {
          warehouses = response.data.warehouses.map((warehouse: any, i: number) =>
            this.transformWarehouseData(warehouse, i)
          );
        } else if (response.success && Array.isArray(response.data)) {
          warehouses = response.data.map((warehouse: any, i: number) =>
            this.transformWarehouseData(warehouse, i)
          );
        }

        return {
          data: warehouses,
          totalRecords: response.data?.total || warehouses.length,
          status: response.status || 'success',
          success: response.success,
        };
      }),
      tap((response) => {
        this.warehousesSubject.next(response.data);
      }),
      catchError((error) => throwError(() => error))
    );
  }

  // -----------------------------------------
  // TRANSFORM WAREHOUSE DATA
  // -----------------------------------------
  private transformWarehouseData(apiWarehouse: any, index: number): WarehouseItem {
    return {
      srNo: index + 1,
      _id: apiWarehouse._id,
      name: apiWarehouse.name,
      location: apiWarehouse.location || {
        address: '',
        city: '',
        state: '',
        country: '',
        pincode: ''
      },
      contactPerson: apiWarehouse.contactPerson || {
        name: '',
        email: '',
        contactNumber: ''
      },
      capacity: apiWarehouse.capacity || 0,
      warehouseType: apiWarehouse.warehouseType || 'storage',
      totalProducts: apiWarehouse.totalProducts || 0,
      currentStock: apiWarehouse.currentStock || 0,
      availableQuantity: apiWarehouse.availableQuantity || 0,
      status: apiWarehouse.isActive ? 'Active' : 'Inactive',
      isActive: apiWarehouse.isActive || false,
      createdBy: apiWarehouse.createdBy,
      createdAt: apiWarehouse.createdAt || new Date().toISOString(),
      updatedAt: apiWarehouse.updatedAt || new Date().toISOString(),
      imgSrc: apiWarehouse.imgSrc || 'assets/images/warehouse-default.jpg',
    };
  }

  // -----------------------------------------
  // GET WAREHOUSE BY ID
  // -----------------------------------------
  getWarehouseById(id: string): Observable<{ data: WarehouseItem; status?: string }> {
    return this.http.get<any>(`${this.apiUrl}/warehouses/${id}`).pipe(
      map((response) => {
        return response;
      }),
      catchError(error => throwError(() => this.errorHandler(error)))
    );
  }

  // -----------------------------------------
  // GET ALL WAREHOUSES (For dropdowns)
  // -----------------------------------------
  getAllWarehouses(): Observable<WarehouseItem[]> {
    return this.http.get<any>(`${this.apiUrl}/warehouses`).pipe(
      map((response) => {
        return response;
      }),
      catchError((error) => this.errorHandler(error))
    );
  }

  // -----------------------------------------
  // GET ACTIVE WAREHOUSES ONLY (For dropdowns)
  // -----------------------------------------
  getActiveWarehouses(): Observable<WarehouseItem[]> {
    return this.http.get<any>(`${this.apiUrl}/warehouses?status=active&limit=1000`).pipe(
      map((response) => {
        let warehouses: WarehouseItem[] = [];

        if (response.success && response.data?.warehouses) {
          warehouses = response.data.warehouses
            .filter((warehouse: any) => warehouse.isActive)
            .map((warehouse: any, i: number) =>
              this.transformWarehouseData(warehouse, i)
            );
        } else if (response.success && Array.isArray(response.data)) {
          warehouses = response.data
            .filter((warehouse: any) => warehouse.isActive)
            .map((warehouse: any, i: number) =>
              this.transformWarehouseData(warehouse, i)
            );
        }

        return warehouses;
      }),
      catchError((error) => this.errorHandler(error))
    );
  }

  // -----------------------------------------
  // UPDATE WAREHOUSE
  // -----------------------------------------
  updateWarehouse(id: string, warehouseData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/warehouses/${id}`, warehouseData).pipe(
      map((response) => ({
        data: response.data,
        status: response.status || 'success',
        message: response.message
      })),
      catchError((error) => this.errorHandler(error))
    );
  }

  // -----------------------------------------
  // ADD WAREHOUSE
  // -----------------------------------------
  addWarehouse(warehouseData: any): Observable<WarehouseItem> {
    return this.http.post<any>(`${this.apiUrl}/warehouses`, warehouseData).pipe(
      map((response) => {
        if (response.success && response.data) {
          return this.transformWarehouseData(response.data, 0);
        }
        throw new Error(response.error || 'Failed to add warehouse');
      }),
      catchError((error) => this.errorHandler(error))
    );
  }

  // -----------------------------------------
  // DELETE WAREHOUSE
  // -----------------------------------------
  deleteWarehouse(id: string): Observable<{ status: string }> {
    return this.http.delete<any>(`${this.apiUrl}/warehouses/${id}`).pipe(
      map((response) => {
        if (response.success) {
          return { status: 'success' };
        }
        return { status: response.status || 'failed' };
      }),
      catchError((error) => this.errorHandler(error))
    );
  }

  // -----------------------------------------
  // ERROR HANDLER
  // -----------------------------------------
  private errorHandler(error: any) {
    // console.error('🔥 Warehouse Service Error:', error);
    return throwError(() => error?.message || 'An unknown error occurred');
  }
}