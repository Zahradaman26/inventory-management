import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component'; 
import { RequestService } from '../services/requests.service';
import { VendorService } from '../services/vendors.service';
import { ProductService } from '../services/product.service';
import { Request } from '../interfaces/request.model';
import { VendorItem } from '../interfaces/vendors.model';
import { ProductItem } from '../interfaces/product.model';

@Component({
  selector: 'app-add-request',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './add-request.component.html',
  styleUrl: './add-request.component.css',
  providers: [RequestService, VendorService, ProductService]
})
export class AddRequestComponent implements OnInit, OnDestroy {
  isEditMode = false;
  requestId: string = '';
  title = 'Add New Request';

  requestForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // Dropdown data
  vendors: VendorItem[] = [];
  products: ProductItem[] = [];
  
  // Loading states
  isLoadingVendors = false;
  isLoadingProducts = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private requestService: RequestService,
    private vendorService: VendorService,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    
    // Load vendors and products
    this.loadVendors();
    this.loadProducts();
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.requestId = params['id'];
        this.title = 'Update Request';
        
        // Wait for vendors and products to load before loading request data
        if (this.vendors.length > 0 && this.products.length > 0) {
          this.loadRequestData(this.requestId);
        } else {
          // If data is still loading, wait for it
          const waitForData = setInterval(() => {
            if (this.vendors.length > 0 && this.products.length > 0) {
              clearInterval(waitForData);
              this.loadRequestData(this.requestId);
            }
          }, 100);
        }
      }
    });
  }

  initializeForm(): void {
    this.requestForm = this.fb.group({
      requestNumber: ['', [Validators.required]],
      vendorId: [null, [Validators.required]],
      items: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      // totalAmount: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
      status: ['requested'] // Auto-set for admin creation
    });

    // Add at least one item by default
    this.addItem();
  }

  // Form array getters
  get items(): FormArray {
    return this.requestForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      productId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      // quantityRequested: [1, [Validators.required, Validators.min(1)]]
    });
  }

  addItem(): void {
    this.items.push(this.createItem());
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    if (this.items.length === 0) {
      this.addItem();
    }
  }

  loadVendors(): void {
    this.isLoadingVendors = true;
    
    this.vendorService.getAllVendors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.vendors = response.data?.vendors || response.data || [];
          this.isLoadingVendors = false;
        },
        error: (error) => {
          console.error('Error loading vendors:', error);
          this.errorMessage = 'Failed to load vendors. Please try again.';
          this.isLoadingVendors = false;
        }
      });
  }

  loadProducts(): void {
    this.isLoadingProducts = true;
    
    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.products = response.data?.products || response.data || [];
          this.isLoadingProducts = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.errorMessage = 'Failed to load products. Please try again.';
          this.isLoadingProducts = false;
        }
      });
  }

  loadRequestData(requestId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.requestService.getRequestById(requestId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (request: Request) => {
          // Wait for vendors and products to be loaded before patching
          if (this.vendors.length === 0 || this.products.length === 0) {
            const checkData = setInterval(() => {
              if (this.vendors.length > 0 && this.products.length > 0) {
                clearInterval(checkData);
                this.patchFormData(request);
              }
            }, 100);
          } else {
            this.patchFormData(request);
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load request data. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private patchFormData(request: Request): void {
    // Clear existing items
    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }

    // Patch basic form data
    const formData: any = {
      requestNumber: request.requestNumber || '',
      vendorId: request.vendorId?._id || null,
      notes: request.notes || '',
      status: request.status || 'requested'
    };

    // Patch items array
    if (request.items && request.items.length > 0) {
      request.items.forEach(item => {
        const itemGroup = this.fb.group({
          productId: [item.product?._id || item.product || '', [Validators.required]],
          quantity: [item.quantityRequested || 1, [Validators.required, Validators.min(1)]]  // Map quantityRequested to quantity field
        });
        this.items.push(itemGroup);
      });
    } else {
      // Add at least one item if none exist
      this.addItem();
    }

    this.requestForm.patchValue(formData);
    
    // Set requestNumber as read-only in edit mode
    this.requestForm.get('requestNumber')?.disable();
    this.requestForm.get('status')?.disable();
    
    this.isLoading = false;
  }

  get f() {
    return this.requestForm.controls;
  }

  onSubmit(): void {
    if (this.requestForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Prepare form data
    const formValue = this.requestForm.value;
    
    // Transform the data for backend
    const requestData = {
      requestNumber: formValue.requestNumber,
      vendorId: formValue.vendorId,
      notes: formValue.notes,
      status: this.isEditMode ? formValue.status : 'requested',
      // Send quantity field (which backend will map to quantityRequested)
      items: formValue.items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity  // This is what backend validation expects
      }))
    };

    // Rest of your submit logic...
    if (this.isEditMode) {
      this.requestService.updateRequest(this.requestId, requestData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = 'Request updated successfully!';
            
            setTimeout(() => {
              this.router.navigate(['/requests']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error || 'Failed to update request. Please try again.';
          }
        });
    } else {
      this.requestService.createRequest(requestData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.requestForm.reset();
            this.requestForm.enable();
            this.initializeForm(); // Reset with one item
            this.isLoading = false;
            this.successMessage = 'Request created successfully!';
            
            setTimeout(() => {
              this.router.navigate(['/requests']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error || 'Failed to create request. Please try again.';
          }
        });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.requestForm.controls).forEach(key => {
      const control = this.requestForm.get(key);
      if (control instanceof FormArray) {
        control.controls.forEach((itemControl: any) => {
          Object.keys(itemControl.controls).forEach(itemKey => {
            itemControl.get(itemKey)?.markAsTouched();
          });
        });
        control.markAsTouched();
      } else {
        control?.markAsTouched();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/requests']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}