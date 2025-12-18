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
  tempUsers: any[] = [];

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
  selectedUserControl = new FormControl('');

  initForm() {
    this.eventForm = this.fb.group({
      eventName: ['', Validators.required],
      description: [''],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
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

  get availableUsers() {
    return this.userList.filter((u) => !this.tempUsers.includes(u._id));
  }

  addUserToCurrentVenue() {
    const user = this.selectedUserControl.value;
    if (!user) return;

    if (!this.tempUsers.includes(user)) {
      this.tempUsers.push(user);
    }

    this.selectedUserControl.reset("");
  }

  addVenueBlock() {
    const venueId = this.selectedVenueControl.value;

    if (!venueId) {
      this.venueError = 'Please select a venue.';
      return;
    }

    if (this.tempUsers.length === 0) {
      this.venueError = 'Please add at least one user.';
      return;
    }

    this.venuesArray.push(
      this.fb.group({
        venueId: [venueId, Validators.required],
        users: [this.tempUsers, Validators.required],
      })
    );

    // Reset
    this.tempUsers = [];
    this.selectedVenueControl.reset();
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

  removeUserFromVenue(venueIndex: number, userIndex: number) {
    const venueGroup = this.venuesArray.at(venueIndex) as FormGroup;
    const users = [...venueGroup.get('users')?.value];

    if (users.length <= 1) {
      alert('A venue must have at least 1 user. Remove venue instead.');
      return;
    }

    users.splice(userIndex, 1);
    venueGroup.patchValue({ users });
  }

  removeTempUser(id: string) {
    this.tempUsers = this.tempUsers.filter((u) => u._id !== id);
  }

  addTempUser() {
    const uid = this.selectedUsersControl.value;
    if (!uid) return;

    const userObj = this.userList.find((x) => x._id === uid);
    if (userObj && !this.tempUsers.some((u) => u._id === uid)) {
      this.tempUsers.push(userObj);
    }

    this.selectedUsersControl.setValue([]);
  }

  loadEventData() {
    if (!this.eventId) return;

    this.eventsService.getEventById(this.eventId).subscribe({
      next: (res: any) => {
        const data = res.data.event;

        this.eventForm.patchValue({
          eventName: data.eventName,
          description: data.description,
          startDate: data.startDate ? data.startDate.substring(0, 10) : '',
          endDate: data.endDate ? data.endDate.substring(0, 10) : '',
          status: data.isActive ? 'active' : 'inactive',
        });

        this.venuesArray.clear();

        (data.venues || []).forEach((v) => {
          this.venuesArray.push(
            this.fb.group({
              venueId: [v.venueId._id, Validators.required],
              users: [v.users.map((u: any) => u._id), Validators.required],
            })
          );
        });
      },
      error: (err) => console.error('Failed to load event', err),
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

    const payload = this.eventForm.value;

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
