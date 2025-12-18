import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component'; 
import { PurchaseOrderService } from '../services/purchase-order.service';
import { VendorService } from '../services/vendors.service';
import { ProductService } from '../services/product.service';
import { PurchaseOrder, PurchaseOrderFormItem } from '../interfaces/purchase-order.model';
import { VendorItem } from '../interfaces/vendors.model';
import { ProductItem } from '../interfaces/product.model';

@Component({
  selector: 'app-add-purchase-order',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent],
  templateUrl: './add-purchase-order.component.html',
  styleUrl: './add-purchase-order.component.css',
  providers: [PurchaseOrderService, VendorService, ProductService]
})
export class AddPurchaseOrderComponent implements OnInit, OnDestroy {
  isEditMode = false;
  purchaseOrderId: string = '';
  title = 'Add New Purchase Order';

  purchaseOrderForm!: FormGroup;
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
    private purchaseOrderService: PurchaseOrderService,
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
        this.purchaseOrderId = params['id'];
        this.title = 'Update Purchase Order';
        
        // Wait for vendors and products to load before loading purchase order data
        if (this.vendors.length > 0 && this.products.length > 0) {
          this.loadPurchaseOrderData(this.purchaseOrderId);
        } else {
          // If data is still loading, wait for it
          const waitForData = setInterval(() => {
            if (this.vendors.length > 0 && this.products.length > 0) {
              clearInterval(waitForData);
              this.loadPurchaseOrderData(this.purchaseOrderId);
            }
          }, 100);
        }
      }
    });
  }

  initializeForm(): void {
    this.purchaseOrderForm = this.fb.group({
      poNumber: ['', [Validators.required]],
      vendorId: [null, [Validators.required]],
      items: this.fb.array([], [Validators.required, Validators.minLength(1)]),
      totalAmount: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
      notes: [''],
      expectedDeliveryDate: [''],
      status: ['draft'] // Default status for new purchase orders
    });

    // Add at least one item by default
    this.addItem();
  }

  // Form array getters
  get items(): FormArray {
    return this.purchaseOrderForm.get('items') as FormArray;
  }

  createItem(): FormGroup {
    return this.fb.group({
      productId: ['', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      totalPrice: [{ value: 0, disabled: true }]
    });
  }

  addItem(): void {
    const itemGroup = this.createItem();
    this.items.push(itemGroup);
    
    // Add change listeners to calculate total price
    itemGroup.get('quantity')?.valueChanges.subscribe(() => this.calculateItemTotal(itemGroup));
    itemGroup.get('unitPrice')?.valueChanges.subscribe(() => this.calculateItemTotal(itemGroup));
    
    this.calculateOrderTotal();
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
    if (this.items.length === 0) {
      this.addItem();
    }
    this.calculateOrderTotal();
  }

  calculateItemTotal(itemGroup: FormGroup): void {
    const quantity = itemGroup.get('quantity')?.value || 0;
    const unitPrice = itemGroup.get('unitPrice')?.value || 0;
    const totalPrice = quantity * unitPrice;
    
    itemGroup.patchValue({ totalPrice: totalPrice }, { emitEvent: false });
    this.calculateOrderTotal();
  }

  calculateOrderTotal(): void {
    let total = 0;
    
    this.items.controls.forEach((itemGroup: any) => {
      const quantity = itemGroup.get('quantity')?.value || 0;
      const unitPrice = itemGroup.get('unitPrice')?.value || 0;
      total += quantity * unitPrice;
    });
    
    this.purchaseOrderForm.patchValue({ totalAmount: total }, { emitEvent: false });
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

  loadPurchaseOrderData(purchaseOrderId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.purchaseOrderService.getPurchaseOrderById(purchaseOrderId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (purchaseOrder: PurchaseOrder) => {
          // Wait for vendors and products to be loaded before patching
          if (this.vendors.length === 0 || this.products.length === 0) {
            const checkData = setInterval(() => {
              if (this.vendors.length > 0 && this.products.length > 0) {
                clearInterval(checkData);
                this.patchFormData(purchaseOrder);
              }
            }, 100);
          } else {
            this.patchFormData(purchaseOrder);
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load purchase order data. Please try again.';
          this.isLoading = false;
        }
      });
  }

  private patchFormData(purchaseOrder: PurchaseOrder): void {
    // Clear existing items
    while (this.items.length !== 0) {
      this.items.removeAt(0);
    }

    // Get vendor ID (could be string or object)
    let vendorId: string | null = null;
    if (typeof purchaseOrder.vendorId === 'string') {
      vendorId = purchaseOrder.vendorId;
    } else if (purchaseOrder.vendorId && purchaseOrder.vendorId._id) {
      vendorId = purchaseOrder.vendorId._id;
    }

    // Format date for input field (yyyy-MM-dd)
    let expectedDeliveryDate = '';
    if (purchaseOrder.expectedDeliveryDate) {
      const date = new Date(purchaseOrder.expectedDeliveryDate);
      if (!isNaN(date.getTime())) {
        expectedDeliveryDate = date.toISOString().split('T')[0];
      }
    }

    // Patch basic form data
    const formData: any = {
      poNumber: purchaseOrder.poNumber || '',
      vendorId: vendorId,
      totalAmount: purchaseOrder.totalAmount || 0,
      notes: purchaseOrder.notes || '',
      expectedDeliveryDate: expectedDeliveryDate,
      status: purchaseOrder.status || 'draft'
    };

    // Patch items array
    if (purchaseOrder.items && purchaseOrder.items.length > 0) {
      purchaseOrder.items.forEach(item => {
        const itemGroup = this.fb.group({
          productId: [item.productId?._id || item.productId || '', [Validators.required]],
          quantity: [item.quantity || 1, [Validators.required, Validators.min(1)]],
          unitPrice: [item.unitPrice || 0, [Validators.required, Validators.min(0)]],
          totalPrice: [{ value: item.totalPrice || 0, disabled: true }]
        });
        
        // Add change listeners
        itemGroup.get('quantity')?.valueChanges.subscribe(() => this.calculateItemTotal(itemGroup));
        itemGroup.get('unitPrice')?.valueChanges.subscribe(() => this.calculateItemTotal(itemGroup));
        
        this.items.push(itemGroup);
      });
    } else {
      // Add at least one item if none exist
      this.addItem();
    }

    this.purchaseOrderForm.patchValue(formData);
    
    // Set poNumber as read-only in edit mode (if not draft)
    if (purchaseOrder.status !== 'draft') {
      this.purchaseOrderForm.get('poNumber')?.disable();
      this.purchaseOrderForm.get('vendorId')?.disable();
      this.purchaseOrderForm.get('items')?.disable();
    }
    
    this.isLoading = false;
  }

  get f() {
    return this.purchaseOrderForm.controls;
  }

  generatePONumber(): void {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const poNumber = `PO-${timestamp}-${random}`;
    this.purchaseOrderForm.patchValue({
      poNumber: poNumber
    });
  }

  onSubmit(): void {
    if (this.purchaseOrderForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Prepare form data
    const formValue = this.purchaseOrderForm.getRawValue(); // Get disabled fields too
    
    // Format items for API
    const items = formValue.items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));

    // Prepare API payload
    const purchaseOrderData: any = {
      poNumber: formValue.poNumber,
      vendorId: formValue.vendorId,
      items: items,
      notes: formValue.notes,
      status: formValue.status
    };

    // Add expected delivery date if provided
    if (formValue.expectedDeliveryDate) {
      purchaseOrderData.expectedDeliveryDate = new Date(formValue.expectedDeliveryDate);
    }

    if (this.isEditMode) {
      // Only update if status is draft
      if (this.purchaseOrderForm.get('status')?.value !== 'draft') {
        this.errorMessage = 'Only draft purchase orders can be updated.';
        this.isLoading = false;
        return;
      }

      this.purchaseOrderService.updatePurchaseOrder(this.purchaseOrderId, purchaseOrderData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = 'Purchase order updated successfully!';
            
            setTimeout(() => {
              this.router.navigate(['/purchase-orders']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error || 'Failed to update purchase order. Please try again.';
          }
        });
    } else {
      this.purchaseOrderService.createPurchaseOrder(purchaseOrderData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.purchaseOrderForm.reset();
            this.purchaseOrderForm.enable();
            this.initializeForm(); // Reset with one item
            this.isLoading = false;
            this.successMessage = 'Purchase order created successfully!';
            
            setTimeout(() => {
              this.router.navigate(['/purchase-orders']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error || 'Failed to create purchase order. Please try again.';
          }
        });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.purchaseOrderForm.controls).forEach(key => {
      const control = this.purchaseOrderForm.get(key);
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
    this.router.navigate(['/purchase-orders']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}