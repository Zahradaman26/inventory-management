import { CommonModule } from '@angular/common';
import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit, OnDestroy } from '@angular/core';
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
import { UserService } from '../services/user.service';
import { UserItem } from '../interfaces/user.model';

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
export class AddVenueComponent implements OnInit, OnDestroy {
  isEditMode = false;
  venueId = '';
  title = 'Add Venue';

  venueForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  users: UserItem[] = [];
  isLoadingUsers = false;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private venueService: VenuesService,
    private userService: UserService
  ) {
    this.initializeForm();
  }

  // ------------------------------
  // INIT
  // ------------------------------
  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.isEditMode = true;
        this.venueId = params['id'];
        this.title = 'Update Venue';

        this.loadUsersAndVenue();
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
      userId: ['', Validators.required],
      isActive: [true],
    });
  }

  // ------------------------------
  // LOAD USERS FIRST, THEN VENUE
  // ------------------------------
  loadUsersAndVenue(): void {
    this.isLoadingUsers = true;

    this.userService
      .getActiveUsers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.users = users;
          this.isLoadingUsers = false;

          // users are ready → now load venue
          this.loadVenueData();
        },
        error: () => {
          this.errorMessage = 'Failed to load users';
          this.isLoadingUsers = false;
        },
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

        // 🔑 MATCH USER USING contactPerson
        const matchedUser = this.users.find(
          (u) =>
            u.name === venue?.contactPerson?.name &&
            u.contactNumber === venue?.contactPerson?.contactNumber
        );

        this.venueForm.patchValue({
          name: venue?.name ?? '',
          location: {
            address: venue?.location?.address ?? '',
            city: venue?.location?.city ?? '',
          },
          userId: matchedUser?._id || '',
          isActive: venue?.isActive ?? true,
        });

        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load venue';
        this.loading = false;
      },
    });
  }

  // ------------------------------
  // GETTERS
  // ------------------------------
  get f() {
    return this.venueForm.controls;
  }

  get locationControls() {
    return (this.venueForm.get('location') as FormGroup).controls;
  }

  // ------------------------------
  // SUBMIT
  // ------------------------------
  onSubmit(): void {
    if (this.venueForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;

    const selectedUserId = this.venueForm.value.userId;
    const selectedUser = this.users.find((u) => u._id === selectedUserId);

    const formData = {
      ...this.venueForm.value,

      // 🔑 IMPORTANT: SAVE BOTH
      userId: selectedUser?._id,

      contactPerson: selectedUser
        ? {
            name: selectedUser.name,
            contactNumber: selectedUser.contactNumber,
          }
        : null,
    };

    const request$ = this.isEditMode
      ? this.venueService.updateVenue(this.venueId, formData)
      : this.venueService.addVenue(formData);

    request$.subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = this.isEditMode
          ? 'Venue updated successfully'
          : 'Venue added successfully';

        setTimeout(() => {
          this.router.navigate(['/venues']);
        }, 1500);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err || 'Something went wrong. Please try again.';
      },
    });
  }

  // ------------------------------
  // TOUCH VALIDATION
  // ------------------------------
  private markFormGroupTouched(): void {
    Object.values(this.venueForm.controls).forEach((control) => {
      if (control instanceof FormGroup) {
        Object.values(control.controls).forEach((c) => c.markAsTouched());
      } else {
        control.markAsTouched();
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
