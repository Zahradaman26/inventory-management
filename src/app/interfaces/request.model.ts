export interface RequestItem {
  product: {
    _id: string;
    name: string;
    SKU: string;
    category?: string;
    warehouseId?: {
      name: string;
      _id: string;
    };
  };
  quantity: number;
  quantityRequested: number;
  status?: string;
}

export interface Request {
  _id: string;
  requestNumber: string;
  vendorId: {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  items: RequestItem[];
  status: 'requested' | 'approved' | 'rejected' | 'completed' | 'cancelled';
  totalAmount: number;
  orderId?: string;
  notes?: string;
  requestedBy: {
    _id: string;
    name: string;
    email?: string;
  };
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface RequestApiResponse {
  success: boolean;
  data: {
    requests: Request[];
    total?: number;
  };
  totalRecords?: number;
  message?: string;
}

export interface SearchResult {
  data: Request[];
  total: number;
}

export interface State {
  page: number;
  pageSize: number;
  searchTerm: string;
  sortColumn: string;
  sortDirection: string;
  startIndex: number;
  endIndex: number;
  totalRecords: number;
  statusFilter?: string;
}