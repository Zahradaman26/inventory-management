import { SortColumn, SortDirection } from "../products/product-sortable.directive";

interface mongoId {
    $oid: string;
}

export interface ProductItem {
    srNo : number;
    _id : string;
    name : string;
    description : string;
    SKU : string;
    category : string;
    price : number;
    stock : number;
    pendingStock: number,
    reservedStock : number,
    stockQuantity: number,
    unit : string,
    minStockLevel : number;
    maxStockLevel : number;
    venue : mongoId;
    createdBy : mongoId;
    products: any;
    data: any;
    isActive : boolean;
    createdAt : number;
    updatedAt : number;
    imgSrc? : string;
    warehouseId : mongoId;
    warehouse?: { // Populated warehouse data
        _id: string;
        name: string;
        location: {
            city: string;
            state: string;
        };
    };
}

export interface ProductApiResponse {
    data: any;
    status? : string;
    totalRecords : number;
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
  data: ProductItem[];
  total: number;
}