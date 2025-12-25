import {
    Component,
    CUSTOM_ELEMENTS_SCHEMA,
    OnInit,
    QueryList,
    ViewChildren,
    OnDestroy,
    ChangeDetectorRef,
} from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { Router, RouterLink } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { VendorItem, SearchResult } from '../interfaces/vendors.model';
import { VendorService } from '../services/vendors.service';
import { FormsModule } from '@angular/forms';
import { VendorSortableHeader, SortEvent } from './vendor-sortable.directive';
import { MatPaginatorModule } from '@angular/material/paginator';
import { finalize } from 'rxjs/operators';
import DataTables from 'datatables.net';
import { ProductService } from '../services/product.service';

@Component({
    selector: 'app-vendors',
    standalone: true,
    imports: [
        BreadcrumbComponent,
        RouterLink,
        CommonModule,
        VendorSortableHeader,
        FormsModule,
        MatPaginatorModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './vendors.component.html',
    styleUrls: ['./vendors.component.css'],
})
export class VendorsComponent implements OnInit, OnDestroy {
    title = 'Vendors List';
    vendorsList: any = [];
    backupVendorsList: any = [];
    productNamesMap: Map<string, string> = new Map(); // Map product IDs to names

    currentPage = 1;
    itemsPerPage = 10;
    totalItems = 0;
    totalPages = 0;
    searchTerm = '';
    statusFilter = '';

    isLoading = false;
    isUpdating = false;
    error: string | null = null;
    successMessage: string | null = null;

    totalRecords: number = 0;
    private dataTable: any;

    selectedVendors: any = [];
    selectedStatus: string = '';
    selectedVendor: any;

    selectedVendorProducts: any[] = [];
    showDeleteModal = false;
    vendorToDelete: VendorItem | null = null;

    private destroy$ = new Subject<void>();

    @ViewChildren(VendorSortableHeader)
    headers!: QueryList<VendorSortableHeader>;

    constructor(
        public vendorService: VendorService,
        private productService: ProductService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.fetchVendors();
    }

    fetchVendors(): void {
        this.isLoading = true;
        this.error = null;

        this.vendorService
            .getAllVendors()
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => {
                    this.isLoading = false;
                })
            )
            .subscribe({
                next: (response) => {
                    this.vendorsList = response.data?.vendors || response.data || [];
                    this.loadProductsForVendors();
                    this.backupVendorsList = [...this.vendorsList];

                    const total = response?.totalRecords ?? this.backupVendorsList.length;
                    this.totalRecords = total;
                    this.vendorService.totalRecords = total;

                    setTimeout(() => {
                        this.initDataTable();
                    }, 100);
                },
                error: (err: any) => {
                    const errMsg = typeof err === 'string'
                        ? err
                        : err?.toString
                            ? err.toString()
                            : 'Failed to load vendors';
                    if (errMsg.includes && errMsg.includes('401')) {
                        this.error = 'Authentication required. Please login again.';
                        setTimeout(() => this.router.navigate(['/sign-in']), 1200);
                    } else {
                        this.error = `Failed to load vendors: ${errMsg}`;
                    }
                },
            });
    }


    loadProductsForVendors(): void {
        this.vendorsList.forEach((vendor: any) => {
            if (vendor._id) {
                this.vendorService.getVendorProducts(vendor._id).subscribe({
                    next: (products) => {
                        // Store the full product objects in vendor.productsData
                        vendor.productsData = products;

                        // Force Angular to update the view
                        setTimeout(() => this.cdr.detectChanges(), 0);
                    },
                    error: (err) => console.error(`Failed to load products for vendor ${vendor._id}`, err)
                });
            }
        });
    }

    initDataTable(): void {
        this.dataTable = new DataTables('#dataTable', {
            paging: true,
            searching: true,
            info: true,
            // ordering: false,
            columnDefs: [
                { className: "dt-head-center", targets: "_all" }
            ]
        });

        document.getElementById('statusFilter')?.addEventListener('change', (e) => {
              const selected = (e.target as HTMLSelectElement).value;

              this.dataTable.rows().every(function () {
                const row = this.node();
                const statusCell = row.querySelector('td:nth-child(7)'); // STATUS COLUMN (7 = index 6)

                if (!statusCell) return;

                const statusText = statusCell.textContent?.trim();

                if (!selected || statusText === selected) {
                  (row as HTMLElement).style.display = '';
                } else {
                  (row as HTMLElement).style.display = 'none';
                }
              });
            });
    }

    viewVendorProducts(vendor: any): void {
        this.selectedVendorProducts = vendor.productsData || [];
    }

    onSearchVendor(searchTerm: string): void {
        this.vendorService.searchTerm = searchTerm;
        this.vendorService.page = 1;
        this.filterData(this.backupVendorsList);
    }

    onPagination(page: number): void {
        this.vendorService.page = page;
        this.filterData(this.backupVendorsList);
    }

    onSort({ column, direction }: SortEvent): void {
        (this.vendorService as any).sortColumn = column;
        (this.vendorService as any).sortDirection = direction;
        this.filterData(this.backupVendorsList);
    }

    updateStatus(vendor: any): void {
        if (this.isUpdating) return;

        const vendorId = vendor._id;
        if (!vendorId) {
            this.error = 'Vendor ID is missing. Cannot update status.';
            return;
        }

        const newStatus = !vendor.isActive;
        this.isUpdating = true;
        this.successMessage = null;
        this.error = null;

        this.vendorService
            .updateVendorStatus(vendorId, newStatus)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    const updateVendorInArray = (arr: any[]) => {
                        const index = arr.findIndex((v) => v._id === vendorId);
                        if (index !== -1) {
                            arr[index].isActive = newStatus;
                        }
                    };

                    updateVendorInArray(this.vendorsList);
                    updateVendorInArray(this.backupVendorsList);
                    updateVendorInArray(this.selectedVendors);

                    this.isUpdating = false;
                    this.successMessage = `Vendor "${vendor.name}" status updated to ${newStatus ? 'Active' : 'Inactive'} successfully!`;

                    setTimeout(() => {
                        this.successMessage = null;
                    }, 3000);
                },
                error: (error) => {
                    this.isUpdating = false;
                    this.error = `Failed to update status: ${error.message || error}`;
                },
            });
    }

    viewVendor(vendor: any): void {
        this.selectedVendor = vendor;
    }

    editVendor(vendor: VendorItem): void {
        this.router.navigate(['/add-vendors', vendor._id]);
    }

    deleteVendor(vendor: any): void {
        this.vendorToDelete = vendor;
        this.showDeleteModal = true;
    }

    closeDeleteModal(): void {
        if (!this.isUpdating) {
            this.showDeleteModal = false;
            this.vendorToDelete = null;
        }
    }

    confirmDeleteVendor(): void {
        if (!this.vendorToDelete) return;

        // const vendorId = this.vendorToDelete._id;
        this.isUpdating = true;
        this.successMessage = null;
        this.error = null;

        this.vendorService.deleteVendor(this.vendorToDelete._id).subscribe({
            next: (response) => {
                    this.isUpdating = false;
                    this.showDeleteModal = false;

                    this.vendorsList = this.vendorsList.filter(
                        (v) => v._id !== this.vendorToDelete!._id
                    );
                    this.backupVendorsList = this.backupVendorsList.filter(
                        (v) => v._id !== this.vendorToDelete!._id
                    );

                    this.successMessage = `Vendor "${this.vendorToDelete?.name}" has been deleted permanently!`;
                    this.vendorToDelete = null;

                    setTimeout(() => {
                        this.successMessage = null;
                    }, 3000);
                },
                error: (err: any) => {
                    this.isUpdating = false;
                    this.showDeleteModal = false;
                    this.error = `Failed to delete vendor: ${err?.toString ? err.toString() : err}`;
                    this.vendorToDelete = null;
                },
        });
    }

    onStatusFilterChange(status: string): void {
        this.selectedStatus = status;
        this.filterData(this.backupVendorsList);
    }

    private filterData(data: any): void {
        let filteredData = data || [];

        if (this.selectedStatus) {
            filteredData = filteredData.filter((vendor: any) => {
                if (this.selectedStatus === 'active') return vendor.isActive;
                if (this.selectedStatus === 'inactive') return !vendor.isActive;
                return true;
            });
        }

        this.vendorService
            ._search(filteredData)
            .subscribe((result: SearchResult) => {
                this.vendorsList = result.data || [];
                this.totalRecords = result.total || 0;
                this.vendorService.totalRecords = this.totalRecords;
            });
    }

    refreshVendors(): void {
        this.fetchVendors();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }
}