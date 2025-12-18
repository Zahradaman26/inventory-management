import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component'; 
import { VendorService } from '../services/vendors.service';
import { VendorItem } from '../interfaces/vendors.model';
import { ProductService } from '../services/product.service'; // Add this import

@Component({
  selector: 'app-add-vendor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent], 
  templateUrl: './add-vendors.component.html',
  styleUrl: './add-vendors.component.css',
  providers: [VendorService, ProductService] // Add ProductService
})
export class AddVendorComponent implements OnInit, OnDestroy {
  isEditMode = false;
  vendorId: string = '';
  title = 'Add New Vendor';

  vendorForm!: FormGroup;
  isLoading = false;
  isLoadingProducts = false;
  errorMessage = '';
  successMessage = '';

  // Products list for selection
  allProducts: any[] = [];
  backupProductsList: any[] = [];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private vendorService: VendorService,
    private productService: ProductService // Inject ProductService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadProducts(); // Load all products for selection
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.vendorId = params['id'];
        this.title = 'Update Vendor';
        this.loadVendorData(this.vendorId);
      }
    });
  }

  initializeForm(): void {
    this.vendorForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      shopName: ['', Validators.required],
      contactNumber: ['', [Validators.required, Validators.pattern(/^[\+]?[1-9][\d]{0,15}$/)]],
      email: ['', [Validators.required, Validators.email]],
      address: ['', Validators.required],
      // FormArray for products - each item is a FormGroup with productId
      products: this.fb.array([this.createProductFormGroup()]),
      isActive: [true],
      notes: ['']
    });
  }

  // Create a product form group
  createProductFormGroup(): FormGroup {
    return this.fb.group({
      productId: ['', Validators.required]
    });
  }

  // FormArray getter for products
  get products(): FormArray {
    return this.vendorForm.get('products') as FormArray;
  }

  // Load all products for selection
  loadProducts(): void {
    this.isLoadingProducts = true;
    this.productService.getAllProducts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp: any) => {
          if (resp.success === true) {
            this.allProducts = resp.data.products;
            this.backupProductsList = resp.data.products;
          } else {
            this.errorMessage = 'Failed to load products. Please try again.';
          }
          this.isLoadingProducts = false;
        },
        error: (error) => {
          console.error('Error loading products:', error);
          this.errorMessage = 'Failed to load products. Please try again.';
          this.isLoadingProducts = false;
        }
      });
  }

  loadVendorData(vendorId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.vendorService.getVendorById(vendorId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (vendor: VendorItem) => {
          this.patchFormData(vendor);
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load vendor data. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private patchFormData(vendor: VendorItem): void {
    // Clear existing FormArray
    while (this.products.length !== 0) {
      this.products.removeAt(0);
    }

    // Patch basic vendor info
    this.vendorForm.patchValue({
      name: vendor.name || '',
      shopName: vendor.shopName || '',
      contactNumber: vendor.contactNumber || '',
      email: vendor.email || '',
      address: vendor.address || '',
      isActive: vendor.isActive !== undefined ? vendor.isActive : true,
      notes: vendor.notes || ''
    });

    // Add products to FormArray
    if (vendor.products && vendor.products.length > 0) {
      vendor.products.forEach((product: any) => {
        const productId = typeof product === 'string' ? product : product._id;
        if (productId) {
          const productGroup = this.createProductFormGroup();
          productGroup.patchValue({ productId });
          this.products.push(productGroup);
        }
      });
    } else {
      // Always have at least one product row
      this.products.push(this.createProductFormGroup());
    }
  }

  // Get available products for a specific row (excluding selected ones in other rows)
  getAvailableProducts(index: number) {
    if (!this.backupProductsList || this.backupProductsList.length === 0) {
      return [];
    }

    // Collect selected product IDs except current row
    const selectedIds = this.products.controls
      .map((control: AbstractControl, i: number) => 
        i !== index ? (control as FormGroup).get('productId')?.value : null
      )
      .filter((id: string | null) => id !== null);

    // Filter products that are NOT selected elsewhere
    return this.backupProductsList.filter((p) => !selectedIds.includes(p._id));
  }

  // Check if we can add more products
  get canAddMore(): boolean {
    if (!this.backupProductsList || this.backupProductsList.length === 0) {
      return false;
    }

    const selectedIds = this.products.controls
      .map((control: AbstractControl) => (control as FormGroup).get('productId')?.value)
      .filter((id: string | null) => id !== null);

    const remaining = this.backupProductsList.length - selectedIds.length;

    return remaining > 0; // Enable if at least 1 product is left
  }

  // Add a new product row
  addProduct(): void {
    if (this.canAddMore) {
      this.products.push(this.createProductFormGroup());
    }
  }

  // Remove a product row
  removeProduct(index: number): void {
    if (this.products.length > 1) {
      this.products.removeAt(index);
    }
  }

  // Form controls getter for template
  get f() {
    return this.vendorForm.controls;
  }

  onSubmit(): void {
    if (this.vendorForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Extract just the product IDs from the FormArray
    const formValue = this.vendorForm.value;
    const productIds = formValue.products
      .map((product: any) => product.productId)
      .filter((id: string) => id); // Filter out empty values

    const vendorData = {
      ...formValue,
      products: productIds // Replace the FormArray with array of IDs
    };

    if (this.isEditMode) {
      this.vendorService.updateVendor(this.vendorId, vendorData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = 'Vendor updated successfully!';
            
            setTimeout(() => {
              this.router.navigate(['/vendors']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error || 'Failed to update vendor. Please try again.';
          }
        });
    } else {
      this.vendorService.addVendor(vendorData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.vendorForm.reset({ isActive: true });
            this.isLoading = false;
            this.successMessage = 'Vendor added successfully!';
            
            setTimeout(() => {
              this.router.navigate(['/vendors']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error || 'Failed to add vendor. Please try again.';
          }
        });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.vendorForm.controls).forEach(key => {
      const control = this.vendorForm.get(key);
      if (control instanceof FormArray) {
        control.controls.forEach((group: AbstractControl) => {
          if (group instanceof FormGroup) {
            Object.keys(group.controls).forEach(nestedKey => {
              group.get(nestedKey)?.markAsTouched();
            });
          }
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/vendors']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}