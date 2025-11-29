import { Component, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import {
  FormGroup,
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormsModule,
  FormControl,
} from '@angular/forms';
import { EventsService } from '../services/events.service';
import { VenuesService } from '../services/venues.service';

@Component({
  selector: 'app-add-event',
  imports: [
    BreadcrumbComponent,
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  templateUrl: './add-event.component.html',
  styleUrl: './add-event.component.css',
})
export class AddEventComponent implements OnInit {
  title = 'Add Event';
  eventForm!: FormGroup;
  loading = false;
  isEditMode = false;
  eventId: string | null = null;
  venueList: any[] = [];
  successMessage = '';
  errorMessage = '';
  venueBlocks: any[] = [];
  selectedVenueId: string = '';
  selectedUsersForVenue: string[] = [];
  venueError = '';
  userList: any[] = [];

  constructor(
    private fb: FormBuilder,
    private eventsService: EventsService,
    private venueService: VenuesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.eventId;

    this.title = this.isEditMode ? 'Update Event' : 'Add Event';

    this.initForm();
    this.loadVenues();
    this.loadUsersData();

    if (this.isEditMode) {
      this.loadEventData();
    }
  }

  selectedVenueControl = new FormControl('');
  selectedUsersControl = new FormControl([]);

  initForm() {
    this.eventForm = this.fb.group({
      eventName: ['', Validators.required],
      description: [''],
      venues: this.fb.array([], Validators.required), // IMPORTANT
      status: ['active', Validators.required],
    });
  }

  get f() {
    return this.eventForm.controls;
  }

  get venuesArray() {
    return this.eventForm.get('venues') as FormArray;
  }

  get availableVenues(): any[] {
    const addedIds = this.venuesArray.value.map((v: any) => v.venueId);
    return this.venueList.filter((v) => !addedIds.includes(v._id));
  }

  addVenueBlock() {
    this.venueError = '';

    const venueId = this.selectedVenueControl.value;
    const usersValue = this.selectedUsersControl.value;
    const users = Array.isArray(usersValue) ? usersValue : [usersValue];

    if (!venueId) {
      this.venueError = 'Please select a venue.';
      return;
    }
    if (!users || users.length === 0) {
      this.venueError = 'Please select at least one user.';
      return;
    }
    if (this.venuesArray.value.some((v: any) => v.venueId === venueId)) {
      this.venueError = 'Venue already added.';
      return;
    }

    this.venuesArray.push(
      this.fb.group({
        venueId: [venueId, Validators.required],
        users: [users, Validators.required],
      })
    );

    this.selectedVenueControl.reset();
    this.selectedUsersControl.reset();
  }

  // remove venue block and restore to dropdown
  removeVenueBlock(index: number) {
    this.venuesArray.removeAt(index);
  }

  // load limited active venues
  loadVenues() {
    this.venueService.getVenues().subscribe({
      next: (res: any) => {
        // response shape may vary, adjust as needed
        const dataVenues = res.data?.venues ?? res.data ?? [];
        this.venueList = dataVenues.filter((v: any) => v.isActive === true);
      },
      error: (err) => {
        console.error('Failed to load venues', err);
        this.venueList = [];
      },
    });
  }

  loadUsersData() {
    this.eventsService.getUsers().subscribe({
      next: (res: any) => {
        const users = res.data?.users ?? res.data ?? [];
        this.userList = users.filter(
          (u: any) => u.isActive === true && u.role === 'user'
        );
      },
      error: (err) => {
        console.error('Failed to load users', err);
        this.userList = [];
      },
    });
  }

  loadEventData() {
    if (!this.eventId) return;

    this.eventsService.getEventById(this.eventId).subscribe({
      next: (res: any) => {
        const data = res.data.event;
        this.eventForm.patchValue({
          eventName: data.eventName,
          description: data.description,
          status: data.isActive ? 'active' : 'inactive',
        });

        // clear and load existing venue blocks
        this.venuesArray.clear();
        (data.venues || []).forEach((v: any) => {
          this.venuesArray.push(
            this.fb.group({
              venueId: [v.venueId._id || v.venueId, Validators.required],

              // FIX: convert users → userIds array
              users: [
                Array.isArray(v.users)
                  ? v.users.map((u: any) => u._id) // extract _id for multi-select
                  : [],
                Validators.required,
              ],
            })
          );
        });
      },
      error: (err) => {
        console.error('Failed to load event', err);
      },
    });
  }

  // helper used in template to show name for an id
  getVenueName(id: string) {
    return this.venueList.find((v) => v._id === id)?.name || 'Unknown';
  }

  getUserName(id: any) {
    return this.userList.find((u) => u._id == id)?.name || id;
  }

  isVenueAdded(venueId: string): boolean {
    return this.venuesArray.value.some((vc: any) => vc.venueId === venueId);
  }

  // submit
  onSubmit() {
    if (this.eventForm.invalid) {
      this.markAllTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const payload = {
      eventName: this.eventForm.value.eventName,
      description: this.eventForm.value.description,
      // convert status -> isActive boolean if backend expects boolean
      isActive: this.eventForm.value.status === 'active',
      venues: this.venuesArray.value.map((v: any) => ({
        venueId: v.venueId,
        users: v.users || [],
      })),
    };

    if (this.isEditMode && this.eventId) {
      this.eventsService.updateEvent(this.eventId, payload).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Event updated successfully';
          setTimeout(() => this.router.navigate(['/events']), 1200);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err || 'Failed to update event';
        },
      });
    } else {
      this.eventsService.addEvent(payload).subscribe({
        next: () => {
          this.loading = false;
          this.successMessage = 'Event created successfully';
          this.eventForm.reset();
          this.initForm();
          setTimeout(() => this.router.navigate(['/events']), 1200);
        },
        error: (err) => {
          this.loading = false;
          this.errorMessage = err || 'Failed to create event';
        },
      });
    }
  }

  private markAllTouched() {
    Object.values(this.eventForm.controls).forEach((control) => {
      if (control instanceof FormArray) {
        control.controls.forEach((g) => g.markAllAsTouched());
      } else {
        control.markAsTouched();
      }
    });
  }
}
