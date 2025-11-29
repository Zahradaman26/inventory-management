import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { VenuesService } from '../services/venues.service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import DataTable from 'datatables.net';

@Component({
  selector: 'app-venue',
  imports: [BreadcrumbComponent, CommonModule, FormsModule, RouterLink],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './venue.component.html',
  styleUrl: './venue.component.css',
  providers: [VenuesService, DecimalPipe],
})
export class VenueComponent implements OnInit {
  title = 'Venues List';
  venuesList: any = [];
  isLoading = false;
  isUpdating = false;
  error: string | null = null;
  successMessage: string | null = null;
  showError: boolean = false;
  showSuccess: boolean = false;
  currentPage = 1;
  itemsPerPage = 10;

  private destroy$ = new Subject<void>();
  private dataTable: any;

  constructor(private venuesService: VenuesService, private router: Router) {}

  ngOnInit(): void {
    this.isLoading = true;

    this.venuesService.getVenues().subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.venuesList = resp.data?.venues ?? [];

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
          setTimeout(() => {
            this.showError = false;
          }, 3000);
        }

        this.isLoading = false;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.showError = true;
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      },
    });
  }

  updateStatus(venue: any): void {
    if (this.isUpdating) return;

    const venueId = venue._id;
    if (!venueId) {
      this.error = 'venue ID missing!';
      return;
    }

    const updatedData = { ...venue, isActive: !venue.isActive };

    this.isUpdating = true;
    this.error = null;
    this.successMessage = null;

    this.venuesService.updateVenue(venueId, updatedData).subscribe({
      next: (response) => {
        const index = this.venuesList.findIndex((w) => w._id === venueId);
        if (index !== -1) {
          this.venuesList[index].isActive = updatedData.isActive;
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

  onEdit(venue: any): void {
    this.router.navigate(['/add-venue', venue._id]);
  }

  onDelete(warehouse: any): void {
    if (!confirm(`Delete warehouse "${warehouse.name}" permanently?`)) return;

    this.isUpdating = true;
    this.error = null;
    this.successMessage = null;

    // this.warehouseService.deleteWarehouse(warehouse._id).subscribe({
    //   next: () => {
    //     this.warehouses = this.warehouses.filter(w => w._id !== warehouse._id);

    //     this.successMessage = `Warehouse "${warehouse.name}" deleted!`;
    //     this.isUpdating = false;

    //     setTimeout(() => (this.successMessage = null), 3000);
    //   },
    //   error: (error) => {
    //     this.error = `Failed to delete warehouse: ${error}`;
    //     this.isUpdating = false;
    //   },
    // });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
