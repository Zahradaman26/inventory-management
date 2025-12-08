import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { EventsService } from '../services/events.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import DataTable from 'datatables.net';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-events',
  imports: [BreadcrumbComponent, CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './events.component.html',
  styleUrl: './events.component.css',
  providers: [EventsService, DecimalPipe],
})
export class EventsComponent implements OnInit {
  title = 'Events List';
  eventsList: any[] = [];
  isLoading = false;
  isUpdating = false;
  error: string | null = null;
  successMessage: string | null = null;
  showError = false;
  showSuccess = false;
  errorMessage = '';
  currentPage = 1;
  itemsPerPage = 10;
  selectedEvent: any = null;

  showDeleteModal = false;
  eventToDelete: any = null;

  private dataTable: any;

  constructor(private eventsService: EventsService, private router: Router) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.eventsService.getEvents().subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.eventsList = resp.data?.events ?? [];

          setTimeout(() => {
            this.dataTable = new DataTable('#dataTable', {
              paging: true,
              searching: true,
              info: true,
            });
          }, 100);
        } else {
          this.error = resp.message;
          this.showError = true;
          setTimeout(() => (this.showError = false), 3000);
        }

        this.isLoading = false;
      },

      error: () => {
        this.isLoading = false;
        this.showError = true;
        setTimeout(() => (this.showError = false), 3000);
      },
    });
  }

  updateStatus(event: any): void {
    if (this.isUpdating) return;

    const eventId = event._id;
    if (!eventId) {
      this.error = 'Event ID missing!';
      return;
    }

    const updatedData = { ...event, isActive: !event.isActive };

    this.isUpdating = true;
    this.error = null;
    this.successMessage = null;

    this.eventsService.updateEvent(eventId, updatedData).subscribe({
      next: (response) => {
        const index = this.eventsList.findIndex((e) => e._id === eventId);
        if (index !== -1) {
          this.eventsList[index].isActive = updatedData.isActive;
        }

        this.successMessage = response.message;
        this.isUpdating = false;

        setTimeout(() => (this.successMessage = null), 3000);
      },

      error: (error) => {
        this.error = `Failed to update status: ${error}`;
        this.isUpdating = false;
      },
    });
  }

  onEdit(event: any): void {
    this.router.navigate(['/add-event', event._id]);
  }

  onDelete(event: any): void {
    this.eventToDelete = event;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (!this.isUpdating) {
      this.showDeleteModal = false;
      this.eventToDelete = null;
    }
  }

  confirmDeleteEvent(): void {
    if (!this.eventToDelete) return;

    this.isUpdating = true;
    this.error = null;
    this.successMessage = null;
    
    this.eventsService.deleteEvent(this.eventToDelete._id).subscribe({
      next: () => {
        this.eventsList = this.eventsList.filter((e) => e._id !== this.eventToDelete._id);
        this.successMessage = `Event "${this.eventToDelete.eventName}" deleted!`;
        this.isUpdating = false;
        this.showDeleteModal = false;
        this.eventToDelete = null;
        
        setTimeout(() => (this.successMessage = null), 3000);
      },
      error: (error) => {
        this.error = `Failed to delete event: ${error}`;
        this.isUpdating = false;
        this.showDeleteModal = false;
        this.eventToDelete = null;
      },
    });
  }

  openDetails(event: any) {
    this.selectedEvent = event;
  }
}
