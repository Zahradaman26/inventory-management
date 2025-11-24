import { SortColumn, SortDirection } from "../users-list/user-sortable.directive";

interface mongoId {
    $oid: string;
}

export interface UserItem {
    srNo: number;
    _id: mongoId;
    name: string;
    contactNumber: string;
    role: string;
    status: 'Active' | 'Inactive';
    department?: string;
    position?: string;
    joinDate: string;
    lastLogin?: number;
    venue?: mongoId;
    createdBy?: mongoId;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
    imgSrc?: string;
    // Add fields from API response
    username?: string;
}

export interface UserApiResponse {
    data: UserItem[];
    status?: string;
    totalRecords: number;
    success?: boolean;
}

// Add separate interfaces for authentication responses
export interface LoginResponse {
    token: string;
    user: UserItem;
    expiresIn?: number;
    status?: string;
}

export interface AuthApiResponse {
    data: LoginResponse;
    status?: string;
    message?: string;
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
  data: UserItem[];
  total: number;
}

// Pagination parameters interface
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  status?: 'Active' | 'Inactive';
  role?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Additional user-specific interfaces
export interface LoginCredentials {
    contactNumber: string;
    password: string;
}

export interface CreateUserRequest {
    name: string;
    contactNumber: string;
    password: string;
    role: string;
    department?: string;
    position?: string;
    status?: 'Active' | 'Inactive';
    venue?: mongoId;
}

export interface UpdateUserRequest {
    name?: string;
    role?: string;
    department?: string;
    position?: string;
    contactNumber?: string;
    status?: 'Active' | 'Inactive';
}

export interface UpdateRoleRequest {
    role: string;
}

export interface UpdateStatusRequest {
    status: 'Active' | 'Inactive';
}

export interface UserFilters {
    search?: string;
    status?: 'Active' | 'Inactive';
    role?: string;
    department?: string;
}

export interface UserStats {
    total: number;
    active: number;
    inactive: number;
    byRole: {
        [role: string]: number;
    };
    byDepartment: {
        [department: string]: number;
    };
}

export interface BulkOperationRequest {
    userIds: mongoId[];
    operation: 'delete' | 'activate' | 'deactivate' | 'changeRole';
    role?: string;
}

export interface BulkOperationResponse {
    success: number;
    failed: number;
    errors?: string[];
    status?: string;
}