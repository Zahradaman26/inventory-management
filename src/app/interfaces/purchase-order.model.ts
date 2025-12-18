export interface PurchaseOrderItem {
  productId: {
    _id: string;
    name: string;
    SKU: string;
    unit: string;
    requestedStock?: number;
    availableStock?: number;
    pendingStock?: number;
    stock?: number;
    minStockLevel?: number;
  };
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  quantityReceived?: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  vendorId: {
    _id: string;
    name: string;
    shopName?: string;
    contactNumber?: string;
    email?: string;
    address?: any;
    businessType?: string;
    rating?: number;
  };
  items: PurchaseOrderItem[];
  totalAmount: number;
  requestedBy: {
    _id: string;
    name: string;
    email?: string;
    contactNumber?: string;
  };
  status: 'draft' | 'pending_approval' | 'approved' | 'ordered' | 'partial_received' | 'received' | 'cancelled' | 'rejected';
  notes?: string;
  expectedDeliveryDate?: Date | string;
  actualDeliveryDate?: Date | string;
  approvedBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  approvedAt?: Date | string;
  receivedBy?: {
    _id: string;
    name: string;
    email?: string;
  };
  receivedAt?: Date | string;
  cancellationReason?: string;
  rejectionReason?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PurchaseOrderApiResponse {
  success: boolean;
  data: {
    purchaseOrders: PurchaseOrder[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
  message?: string;
}

export interface PurchaseOrderStatistics {
  timeframe: string;
  startDate: Date;
  statistics: Array<{
    status: string;
    count: number;
    totalAmount: number;
    totalItems: number;
    totalQuantity: number;
  }>;
  summary: {
    totalPurchaseOrders: number;
    totalAmount: number;
    pendingOrders: number;
    completedOrders: number;
  };
}

export interface SearchResult {
  data: PurchaseOrder[];
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

// Add this interface for form items
export interface PurchaseOrderFormItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
}

// Add this interface for form data
export interface PurchaseOrderFormData {
  poNumber?: string;
  vendorId: string | null;
  items: PurchaseOrderFormItem[];
  notes?: string;
  expectedDeliveryDate?: Date | string;
  status: string;
}