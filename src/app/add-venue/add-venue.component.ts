import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { VenuesService } from '../services/venues.service';

@Component({
  selector: 'app-add-venue',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './add-venue.component.html',
  styleUrl: './add-venue.component.css',
})
export class AddVenueComponent implements OnInit {
  isEditMode = false;
  venueId: string = '';
  title = 'Add Venue';
  venueForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private venueService: VenuesService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.venueId = params['id'];
        this.title = 'Edit Venue';
        this.loadVenueData();
      }
    });
  }

  // ------------------------------
  // FORM INITIALIZATION
  // ------------------------------
  initializeForm(): void {
    this.venueForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      location: this.fb.group({
        address: ['', Validators.required],
        city: ['', Validators.required],
      }),
      contactPerson: this.fb.group({
        name: ['', Validators.required],
        contactNumber: ['', [Validators.required, Validators.minLength(10)]],
      }),
      isActive: [true],
    });
  }

  // ------------------------------
  // LOAD VENUE DATA (EDIT MODE)
  // ------------------------------
  loadVenueData(): void {
    this.loading = true;

    this.venueService.getVenueById(this.venueId).subscribe({
      next: (resp: any) => {
        const venue = resp.data?.venue;

        this.venueForm.patchValue({
          name: venue?.name ?? '',
          location: {
            address: venue?.location?.address ?? '',
            city: venue?.location?.city ?? '',
          },
          contactPerson: {
            name: venue?.contactPerson?.name ?? 'NA',
            contactNumber: venue?.contactPerson?.contactNumber ?? 'NA',
          },
          isActive: venue?.isActive ?? true,
        });

        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load venue data. Try again later.';
        this.loading = false;
      },
    });
  }

  get f() {
    return this.venueForm.controls;
  }
  get locationControls() {
    return (this.venueForm.get('location') as FormGroup).controls;
  }
  get contactControls() {
    return (this.venueForm.get('contactPerson') as FormGroup).controls;
  }

  onSubmit(): void {
    if (this.venueForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formData = this.venueForm.value;

    if (this.isEditMode) {
      this.venueService.updateVenue(this.venueId, formData).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Venue updated successfully';

          setTimeout(() => {
            this.router.navigate(['/venues']);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage =
            error || 'Failed to update venue. Please try again.';
        },
      });
    } else {
      this.venueService.addVenue(formData).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Venue added successfully!';
          this.venueForm.reset();
          this.initializeForm();

          setTimeout(() => {
            this.router.navigate(['/venues']);
          }, 1500);
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error || 'Failed to add venue. Please try again.';
        },
      });
    }
  }

  // ------------------------------
  // TOUCH VALIDATION
  // ------------------------------
  private markFormGroupTouched(): void {
    Object.keys(this.venueForm.controls).forEach((key) => {
      const control = this.venueForm.get(key);
      if (control instanceof FormGroup) {
        Object.keys(control.controls).forEach((nestedKey) => {
          control.get(nestedKey)?.markAsTouched();
        });
      } else {
        control?.markAsTouched();
      }
    });
  }

  // ------------------------------
  // DESTROY
  // ------------------------------
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
