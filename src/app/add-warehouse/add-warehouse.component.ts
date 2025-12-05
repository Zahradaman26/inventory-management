import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { WarehouseService } from '../services/warehouse.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-add-warehouse',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './add-warehouse.component.html',
  styleUrl: './add-warehouse.component.css',
})
export class AddWarehouseComponent implements OnInit {
  isEditMode = false;
  warehouseId: string = '';
  title = 'Add Warehouse';

  warehouseForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  private destroy$ = new Subject<void>();
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private warehouseService: WarehouseService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.initializeForm();

    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.warehouseId = params['id'];
        this.title = 'Edit Warehouse';
        this.loadProductData();
      }
    });
  }

  initializeForm(): void {
    this.warehouseForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      location: this.fb.group({
        address: ['', Validators.required],
        city: ['', Validators.required],
        // state: ['', Validators.required],
        // country: ['', Validators.required],
        // pincode: ['', Validators.required]
      }),
      contactPerson: this.fb.group({
        name: ['', Validators.required],
        // email: ['', [Validators.required, Validators.email]],
        contactNumber: ['', [Validators.required, Validators.minLength(10)]],
      }),
      // capacity: ['', [Validators.required, Validators.min(1)]],
      // warehouseType: ['', Validators.required],
      isActive: [true],
    });
  }

  loadProductData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.warehouseService.getWarehouseById(this.warehouseId).subscribe({
        next: (resp: any) => {
          // Transform the product data to match form field names
          const warehouse = resp.data.warehouse;
          this.warehouseForm.patchValue({
            name: warehouse?.name ?? '',
            location: {
              address: warehouse?.location?.address ?? '',
              city: warehouse?.location?.city ?? '',
            },
            contactPerson: {
              name: warehouse?.contactPerson?.name ?? '',
              contactNumber: warehouse?.contactPerson?.contactNumber ?? '',
            },
            isActive: warehouse?.isActive ?? true,
          });

          this.loading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load product data. Please try again.';
          this.loading = false;
        },
      });
  }

  get f() {
    return this.warehouseForm.controls;
  }

  get locationControls() {
    return (this.warehouseForm.get('location') as FormGroup).controls;
  }

  get contactPersonControls() {
    return (this.warehouseForm.get('contactPerson') as FormGroup).controls;
  }

  onSubmit(): void {
    if (this.warehouseForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const warehouseData = this.warehouseForm.value;
    const formData = { ...this.warehouseForm.value };

    if (this.isEditMode) {
      this.warehouseService
        .updateWarehouse(this.warehouseId, warehouseData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response) => {
            this.loading = false;
            this.successMessage = 'Warehouse updated successfully';

            setTimeout(() => {
              this.router.navigate(['/warehouses']);
            }, 1500);
          },
          error: (error) => {
            this.loading = false;
            this.errorMessage =
              error || 'Failed to update warehouse. Please try again';
          },
        });
    } else {
      this.warehouseService.addWarehouse(formData).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'Warehouse added successfully!';
          this.warehouseForm.reset();
          this.initializeForm();
          setTimeout(() => {
            this.router.navigate(['/warehouses']);
          }, 1500);
        },
        error: (error) => {
          // console.error('Error adding warehouse:', error);
          this.loading = false;
          this.errorMessage =
            error || 'Failed to add warehouse. Please try again.';
        },
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.warehouseForm.controls).forEach((key) => {
      const control = this.warehouseForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach((nestedKey) => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
