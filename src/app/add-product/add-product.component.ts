import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component'; 
import { ProductService } from '../services/product.service';
import { ProductItem } from '../interfaces/product.model';

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent], 
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css',
  providers: [DecimalPipe, ProductService]
})
export class AddProductComponent implements OnInit, OnDestroy {
  isEditMode = false;
  productId: string = '';
  title = 'Add New Product';

  productForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Other'];
  warehouses = ['Begumwadi'];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.productId = params['id'];
        this.title = 'Edit Product';
        this.loadProductData(this.productId);
      }
    });
  }

  initializeForm(): void {
    this.productForm = this.fb.group({
      SKU: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(0)]],
      warehouseId: ['', [Validators.required, Validators.min(0)]],
      stock: [0, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  loadProductData(productId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getProductById(productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (product: ProductItem) => {
          // Transform the product data to match form field names
          const formData = {
            SKU: product.SKU || '',
            name: product.name || '',
            description: product.description || '',
            category: product.category || '',
            price: product.price || 0,
            stock: product.stock || 0,
            isActive: product.isActive !== undefined ? product.isActive : true,
            warehouseId: product.warehouseId || ''
          };

          this.productForm.patchValue(formData);
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load product data. Please try again.';
          this.isLoading = false;
        }
      });
  }

  get f() {
    return this.productForm.controls;
  }

  generateSKU(): void {
    const prefix = 'PROD';
    const random = Math.floor(1000 + Math.random() * 9000);
    this.productForm.patchValue({
      SKU: `${prefix}-${random}`
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const productData = this.productForm.value;
    productData.unit = "pcs";

    if (this.isEditMode) {
      this.productService.updateProduct(this.productId, productData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.isLoading = false;
            this.successMessage = 'Product updated successfully!';
            
            setTimeout(() => {
              this.router.navigate(['/products']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error || 'Failed to update product. Please try again.';
          }
        });
    } else {
      this.productService.addProduct(productData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.productForm.reset();
            this.isLoading = false;
            this.successMessage = 'Product added successfully!';
            
            setTimeout(() => {
              this.router.navigate(['/products']);
            }, 1500);
          },
          error: (error) => {
            this.isLoading = false;
            this.errorMessage = error || 'Failed to add product. Please try again.';
          }
        });
    }
  }

  onDelete(): void {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    this.isLoading = true;
    this.productService.deleteProduct(this.productId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Product deleted successfully!';
          
          setTimeout(() => {
            this.router.navigate(['/products']);
          }, 1500);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = 'Failed to delete product. Please try again.';
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productForm.controls).forEach(key => {
      this.productForm.get(key)?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}