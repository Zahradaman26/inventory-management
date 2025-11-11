import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule, DecimalPipe } from '@angular/common';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component'; 
import { ProductService } from '../services/product.service';


@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent], 
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css',
  providers: [ProductService, DecimalPipe]
})
export class AddProductComponent implements OnInit {
  title = 'Add New Product';
  productForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Beauty', 'Toys', 'Other'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private productService: ProductService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.productForm = this.fb.group({
      sku: ['', [Validators.required, Validators.minLength(3)]],
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      category: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      stockQuantity: ['', [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
  }

  get f() {
    return this.productForm.controls;
  }

  generateSKU(): void {
    const prefix = 'PROD';
    const random = Math.floor(1000 + Math.random() * 9000);
    this.productForm.patchValue({
      sku: `${prefix}-${random}`
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const productData = this.productForm.value;

    // Use the actual ProductService to save to API
    this.productService.addProduct(productData).subscribe({
      next: (response) => {
        this.productForm.reset();
        this.loading = false;
        this.successMessage = 'Product added successfully!';
        this.router.navigate(['/products']);
        
        // Redirect to products list after 2 seconds
        // setTimeout(() => {
        // }, 2000);
      },
      error: (error) => {
        console.error('Error adding product:', error);
        this.loading = false;
        this.errorMessage = error || 'Failed to add product. Please try again.';
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
}