import { CommonModule, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import DataTable from 'datatables.net';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import {
  FormGroup,
  FormBuilder,
  Validators,
  FormArray,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { OrdersService } from '../services/orders.service';
import { ReturnsService } from '../services/returns.service';

@Component({
  selector: 'app-returns',
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    ReactiveFormsModule,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './returns.component.html',
  styleUrl: './returns.component.css',
  providers: [OrdersService, DecimalPipe, ReturnsService],
})
export class ReturnsComponent implements OnInit {
  title = 'Returns';
  returnForm!: FormGroup;
  ordersList = [];
  backupOrdersList = [];
  returnsList = [];
  backupReturnsList = [];
  loading: boolean = false;
  showError: boolean = false;
  showSuccess: boolean = false;
  selectedReturn: any = null;
  private dataTable: any;

  // Pagination and filtering
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  searchTerm = '';
  statusFilter = '';

  isUpdating = false;
  respMessage: string = '';
  rejectionReason: string = ''; // Add this for rejection reason input

  constructor(
    private formBuilder: FormBuilder,
    private ordersService: OrdersService,
    private returnsService: ReturnsService
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.ordersService.getAllOrders().subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          const filtered = resp.data.orders.filter(
            (r) => r.status === 'issued'
          );

          this.ordersList = filtered;
          this.backupOrdersList = filtered;
        } else {
          this.showError = true;
          setTimeout(() => {
            this.showError = false;
          }, 3000);
        }

        this.returnsService.getAllReturns().subscribe({
          next: (resp: any) => {
            if (resp.success === true) {
              this.returnsList = resp.data.returns;
              this.backupReturnsList = resp.data.returns;

              setTimeout(() => {
                this.dataTable = new DataTable('#dataTable', {
                  paging: true,
                  searching: true,
                  info: true,
                  ordering: false,
                  columnDefs: [
                    { className: "dt-head-center", targets: "_all" }   
                  ],
                });
              }, 100);
            } else {
              this.showError = true;
              setTimeout(() => {
                this.showError = false;
              }, 3000);
            }
          },
          error: (err: any) => {
            this.loading = false;
            this.showError = true;
            setTimeout(() => {
              this.showError = false;
            }, 3000);
          },
        });
      },
      error: (err: any) => {
        this.loading = false;
        this.showError = true;
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      },
    });

    this.returnForm = this.formBuilder.group({
      orderId: ['', Validators.required],
      eventName: [''],
      venueName: [''],
      returnReason: [''],
      notes: [''],
      items: this.formBuilder.array([]),
    });
  }

  get items() {
    return this.returnForm.get('items') as FormArray;
  }

  openReturnDetails(ret: any) {
    this.selectedReturn = ret;
  }

  onOrderChange() {
    const selected = this.ordersList.find(
      (o) => o._id === this.returnForm.value.orderId
    );

    if (!selected) return;

    this.returnForm.patchValue({
      eventName: selected.eventId.eventName,
      // venueName: selected.venueId.venueName || ''
    });

    // Load items
    this.items.clear();

    selected.items.forEach((p: any) => {
      this.items.push(
        this.formBuilder.group({
          productId: [p.productId._id],
          productName: [p.productId.name],
          orderQuantity: [p.productId.quantityApproved], // ← for validation
          quantityReturned: [0],
          quantityPending: [0],
          quantityLost: [0],
          lossReason: [''],
          condition: ['good'],
          invalidQty: [false],
        })
      );
    });
  }

  // Helper to get display status
  getDisplayStatus(returnItem: any): string {
    return this.returnsService.getDisplayStatus(returnItem);
  }

  // Helper to get badge class
  getStatusBadgeClass(returnItem: any): string {
    return this.returnsService.getStatusBadgeClass(returnItem);
  }

  // Check if fully returned
  isFullyReturned(returnItem: any): boolean {
    return returnItem.statusReturn === 'fullyReturned';
  }

  // Check if partially returned
  isPartiallyReturned(returnItem: any): boolean {
    return returnItem.statusReturn === 'partiallyReturned';
  }

  // Check if pending approval
  isPendingApproval(returnItem: any): boolean {
    return returnItem.statusApproval === 'pendingApproval';
  }

  // Check if already approved/rejected
  isDecisionMade(returnItem: any): boolean {
    return ['approved', 'rejected', 'partiallyApproved'].includes(returnItem.statusApproval);
  }

  // Update the approveReturn method
  approveReturn(returnId: string): void {
    this.isUpdating = true;
    this.returnsService.approveReturn(returnId).subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.updateReturnStatus(returnId, resp.data.return);
          this.showSuccess = true;
          this.respMessage = 'Return request approved! User can now return items.';
        } else {
          this.showError = true;
          this.respMessage = resp.message || 'Failed to approve return';
        }
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showSuccess = false;
          this.showError = false;
        }, 3000);
      },
      error: (err: any) => {
        this.showError = true;
        this.respMessage = 'Error approving return';
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      }
    });
  }

  // Update the approvePartialReturn method
  approvePartialReturn(returnId: string): void {
    this.isUpdating = true;
    this.returnsService.approvePartialReturn(returnId).subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.updateReturnStatus(returnId, resp.data.return);
          this.showSuccess = true;
          this.respMessage = 'Partial return request approved!';
        } else {
          this.showError = true;
          this.respMessage = resp.message || 'Failed to approve partial return';
        }
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showSuccess = false;
          this.showError = false;
        }, 3000);
      },
      error: (err: any) => {
        this.showError = true;
        this.respMessage = 'Error approving partial return';
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      }
    });
  }

  // Reject return
  rejectReturn(returnId: string): void {
    this.isUpdating = true;
    this.returnsService.rejectReturn(returnId, this.rejectionReason).subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.updateReturnStatus(returnId, resp.data.return);
          this.showSuccess = true;
          this.respMessage = 'Return rejected successfully!';
          this.rejectionReason = ''; // Clear after successful rejection
        } else {
          this.showError = true;
          this.respMessage = resp.message || 'Failed to reject return';
        }
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showSuccess = false;
          this.showError = false;
        }, 3000);
      },
      error: (err: any) => {
        this.showError = true;
        this.respMessage = 'Error rejecting return';
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      }
    });
  }

  // Update the local return data
  private updateReturnStatus(returnId: string, updatedReturn: any): void {
    const returnIndex = this.returnsList.findIndex(returnItem => returnItem._id === returnId);
    if (returnIndex !== -1) {
      // Update all fields from the response
      this.returnsList[returnIndex] = { 
        ...this.returnsList[returnIndex], 
        ...updatedReturn 
      };
      
      // Also update backup list
      const backupIndex = this.backupReturnsList.findIndex(returnItem => returnItem._id === returnId);
      if (backupIndex !== -1) {
        this.backupReturnsList[backupIndex] = { 
          ...this.backupReturnsList[backupIndex], 
          ...updatedReturn 
        };
      }
    }
  }

  validateQuantity(i: number) {
    const item = this.items.at(i);

    const total =
      Number(item.value.quantityReturned) +
      Number(item.value.quantityPending) +
      Number(item.value.quantityLost);

    item.patchValue({
      invalidQty: total != item.value.orderQuantity,
    });
  }

  submitReturn() {
    if (this.returnForm.invalid) return;

    const payload = this.returnForm.value;

    console.log('Final JSON:', payload);
    // hit your POST API
    // this.api.createReturn(payload).subscribe(...)
  }
}