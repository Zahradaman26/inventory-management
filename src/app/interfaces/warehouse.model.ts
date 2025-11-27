import { SortColumn, SortDirection } from "../users-list/user-sortable.directive";

interface mongoId {
    $oid: string;
}

export interface Location {
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
}

export interface ContactPerson {
    name: string;
    contactNumber: string;
    email: string;
}

export interface WarehouseItem {
    srNo: number;
    _id: string;
    name: string;
    location: Location;
    contactPerson: ContactPerson;
    capacity: number;
    warehouseType: 'main' | 'regional' | 'distribution' | 'storage';
    totalProducts?: number;
    currentStock?: number;
    availableQuantity?: number;
    status: 'Active' | 'Inactive';
    isActive: boolean;
    createdBy: mongoId;
    createdAt: string;
    updatedAt: string;
    imgSrc?: string;
}

export interface WarehouseApiResponse {
    data: any;
    warehouses: WarehouseItem[];
    status?: string;
    totalRecords: number;
    total: number;
    success?: boolean;
}

export interface State {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: SortColumn;
  sortDirection: SortDirection;
  startIndex: number;
  endIndex: number;
  totalRecords: number;
}

export interface SearchResult {
  data: WarehouseItem[];
  total: number;
}

// Pagination parameters interface
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'Active' | 'Inactive';
  warehouseType?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Additional warehouse-specific interfaces
export interface CreateWarehouseRequest {
    name: string;
    location: Location;
    contactPerson: ContactPerson;
    capacity: number;
    warehouseType: 'main' | 'regional' | 'distribution' | 'storage';
    status?: 'Active' | 'Inactive';
}

export interface UpdateWarehouseRequest {
    name?: string;
    location?: Location;
    contactPerson?: ContactPerson;
    capacity?: number;
    warehouseType?: 'main' | 'regional' | 'distribution' | 'storage';
    status?: 'Active' | 'Inactive';
}

export interface UpdateStatusRequest {
    status: 'Active' | 'Inactive';
}

export interface WarehouseFilters {
    search?: string;
    status?: 'Active' | 'Inactive';
    warehouseType?: string;
}

export interface WarehouseStats {
    total: number;
    active: number;
    inactive: number;
    byType: {
        [type: string]: number;
    };
    totalCapacity: number;
    utilizedCapacity: number;
}

export interface WarehouseDropdown {
    _id: string;
    name: string;
    location: {
        city: string;
        state: string;
    };
    capacity: number;
    currentStock?: number;
}
