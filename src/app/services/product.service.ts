import { Injectable, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // Remove HttpHeaders
import { Observable, catchError, throwError, map, of } from 'rxjs';
import { DecimalPipe } from '@angular/common'; 
import { ProductApiResponse, ProductItem, State, SearchResult } from '../interfaces/product.model';
import { SortColumn, SortDirection } from '../products/product-sortable.directive'; 
import { environment } from '../../environments/environment';

const compare = (v1: string | number, v2: string | number) => v1 < v2 ? -1 : v1 > v2 ? 1 : 0;
function sort(products: ProductItem[], column: string, direction: string): ProductItem[] {
  if (direction === '' || column === '') return products;
  return [...products].sort((a: any, b: any) => { 
    const res = compare(a[column]!, b[column]!);
    return direction === 'asc' ? res : -res;
  });
}
function matches(product: ProductItem, term: string, pipe: PipeTransform) {
  return (
    product.name.toLowerCase().includes(term.toLowerCase()) ||
    product.sku.toLowerCase().includes(term.toLowerCase())
  );
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  
  private readonly PRODUCTS_API_URL = `${environment.apiUrl}/products`; 

  private _state: State = {
    page: 1, pageSize: 10, searchTerm: '', sortColumn: '', sortDirection: '',
    startIndex: 0, endIndex: 9, totalRecords: 0,
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
    // Recalculate indices when page or pageSize changes
    if (patch.page || patch.pageSize) {
      this._state.startIndex = ((this._state.page - 1) * this._state.pageSize) + 1;
      this._state.endIndex = Math.min(this._state.page * this._state.pageSize, this._state.totalRecords);
    }
  }

  // 🔑 READ: GET All Products - SIMPLIFIED (no headers)
  // getAllProducts(): Observable<ProductApiResponse> {
  //   return this.http.get<ProductItem[]>(this.PRODUCTS_API_URL).pipe(
  //     map(productsArray => {
  //       const products = productsArray.map((p, index) => ({
  //           ...p,
  //           srNo: index + 1, 
  //           imgSrc: `assets/images/product-placeholder-${(index % 3) + 1}.png`
  //       }));
        
  //       return { products: products, totalRecords: products.length };
  //     }),
  //     catchError(this.errorHandler)
  //   );
  // }

  //for now use this ->
  getAllProducts(): Observable<ProductApiResponse> {
    return this.http.get<any>(this.PRODUCTS_API_URL).pipe(
      map(response => {
        console.log('Raw API response:', response);
        
        // Handle different response structures
        let productsArray: ProductItem[];
        
        if (Array.isArray(response)) {
          // Case 1: Response is directly an array
          productsArray = response;
        } else if (response.products && Array.isArray(response.products)) {
          // Case 2: Response has { products: [], totalRecords: number }
          productsArray = response.products;
        } else if (response.data && Array.isArray(response.data)) {
          // Case 3: Response has { data: [], totalRecords: number }
          productsArray = response.data;
        } else {
          // Case 4: Unexpected structure, return empty
          console.error('Unexpected API response structure:', response);
          productsArray = [];
        }
        
        const products = productsArray.map((p, index) => ({
            ...p,
            srNo: index + 1, 
            imgSrc: p.imgSrc || `assets/images/product-placeholder-${(index % 3) + 1}.png`
        }));
        
        return { 
          products: products, 
          totalRecords: response.totalRecords || products.length 
        };
      }),
      catchError(this.errorHandler)
    );
  }

  // 🔑 READ: GET Single Product by ID - SIMPLIFIED
  getProductById(productId: string): Observable<ProductItem> {
    return this.http.get<ProductItem>(
      `${this.PRODUCTS_API_URL}/${productId}`
    ).pipe(
      catchError(this.errorHandler)
    );
  }

  // 🔑 CREATE: Add New Product - SIMPLIFIED
  addProduct(productData: any): Observable<ProductItem> {
    return this.http.post<ProductItem>(
      this.PRODUCTS_API_URL,
      productData
    ).pipe(
      catchError(this.errorHandler)
    );
  }

  // 🔑 UPDATE: Update Product - SIMPLIFIED
  updateProduct(productId: string, productData: any): Observable<ProductItem> {
    return this.http.put<ProductItem>(
      `${this.PRODUCTS_API_URL}/${productId}`,
      productData
    ).pipe(
      catchError(this.errorHandler)
    );
  }

  // 🔑 UPDATE: Update Product Status - SIMPLIFIED
  updateProductStatus(productId: string, isActive: boolean): Observable<any> {
    const payload = { isActive };
    
    return this.http.patch(
      `${this.PRODUCTS_API_URL}/${productId}`, 
      payload
    ).pipe(
      catchError(this.errorHandler)
    );
  }

  // 🔑 DELETE: Delete Product - SIMPLIFIED
  deleteProduct(productId: string): Observable<any> {
    return this.http.delete(
      `${this.PRODUCTS_API_URL}/${productId}`
    ).pipe(
      catchError(this.errorHandler)
    );
  }

  // 🔑 BULK DELETE: Delete Multiple Products - SIMPLIFIED
  deleteMultipleProducts(productIds: string[]): Observable<any> {
    return this.http.post(
      `${this.PRODUCTS_API_URL}/bulk-delete`,
      { productIds }
    ).pipe(
      catchError(this.errorHandler)
    );
  }
  
  // 🔑 Local Search/Sort/Paginate Logic - FIXED VERSION
  public _search(productList: Array<ProductItem> = []): Observable<SearchResult> {
    const { sortColumn, sortDirection, pageSize, page, searchTerm } = this._state;

    console.log(`_search called with:`, {
        productListLength: productList.length,
        page,
        pageSize,
        searchTerm,
        sortColumn,
        sortDirection
    });

    // 1. Filter products based on search term
    let products = productList.filter((item) => matches(item, searchTerm, this.pipe));
    console.log(`After search filter: ${products.length} products`);
    
    // 2. Sort the filtered products
    products = sort(products, sortColumn, sortDirection);

    // 3. Update total records
    const total = products.length;
    this.totalRecords = total;
    
    // 4. Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, total);
    
    // 5. Update state indices (1-based for display)
    this._state.startIndex = total > 0 ? startIndex + 1 : 0;
    this._state.endIndex = total > 0 ? endIndex : 0;

    // 6. Slice for current page
    const paginatedProducts = products.slice(startIndex, endIndex);
    
    console.log(`Pagination: Showing ${paginatedProducts.length} of ${total} products`);
    
    return of({ 
        products: paginatedProducts, 
        total: total 
    });
  }


  private errorHandler(error: any) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      errorMessage = error.error?.message || error.message || `Server Error: ${error.status}`;
    }
    
    console.error('Product Service Error:', error);
    return throwError(() => errorMessage);
  }
}