import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component'; 

@Component({
  selector: 'app-add-product',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, BreadcrumbComponent], 
  templateUrl: './add-product.component.html',
  styleUrl: './add-product.component.css'
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
    private router: Router
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
    console.log('Product data to save:', productData);

    setTimeout(() => {
      this.loading = false;
      this.successMessage = 'Product added successfully! (Demo)';
      
      setTimeout(() => {
        this.router.navigate(['/products']);
      }, 2000);
    }, 1000);
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