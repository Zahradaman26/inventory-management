import { CommonModule, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import DataTable from 'datatables.net';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ProductService } from '../services/product.service';
import { OrdersService } from '../services/orders.service';
import { AuthService } from '../services/auth-service.service';
import { VenuesService } from '../services/venues.service';
import { EventsService } from '../services/events.service';
declare var bootstrap: any;

@Component({
  selector: 'app-orders',
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    ReactiveFormsModule,
    FormsModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.css',
  providers: [ProductService, OrdersService, DecimalPipe, AuthService],
})
export class OrdersComponent implements OnInit {
  title = 'Orders';
  userId = '';
  orderForm!: FormGroup;
  productsList = [];
  backupProductsList: any;
  ordersList = [];
  backupOrdersList = [];
  venuesList = [];
  backupVenuesList = [];
  eventList = [];
  backupEventList = [];
  loading: boolean = false;
  showError: boolean = false;
  showSuccess: boolean = false;
  selectedOrder: any = null;
  isEditMode = false;
  selectedOrderId: string | null = null;
  private dataTable: any;
  respMessage: string = '';
  selectAll: boolean = false;
  selectedOrders: Set<string> = new Set();

  isUpdating = false;
  constructor(
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private ordersService: OrdersService,
    private authService: AuthService,
    private venuesService: VenuesService,
    private eventsService: EventsService
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const parsed = JSON.parse(userData);
      this.userId = parsed._id;
    } else {
      this.authService.logout();
    }

    this.loading = true;
    this.ordersService.getAllOrders().subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.ordersList = resp.data.orders;
          this.backupOrdersList = resp.data.orders;

          setTimeout(() => {
            this.dataTable = new DataTable('#dataTable', {
              paging: true,
              searching: true,
              info: true,
            });
          }, 100);
        } else {
          this.showError = true;
          setTimeout(() => {
            this.showError = false;
          }, 3000);
        }

        this.productService.getAllProducts().subscribe({
          next: (resp: any) => {
            if (resp.success === true) {
              this.productsList = resp.data.products;
              this.backupProductsList = resp.data.products;
              
              this.venuesService.getVenues().subscribe({
                next: (venuesResp: any) => {
                  if (venuesResp.success === true) {
                    const venues = venuesResp.data?.venues ?? [];
                    
                    const filteredVenues = venues.filter((venue: any) =>
                      venue.users?.some((user: any) => user._id === this.userId)
                    );
                    
                    this.venuesList = filteredVenues;
                    this.backupVenuesList = filteredVenues;
                    
                    this.eventsService.getEvents().subscribe({
                      next: (eventsResp: any) => {
                        if (eventsResp.success === true) {
                          const events = eventsResp.data?.events ?? [];
                          
                          const filteredEvents = events.filter((event: any) =>
                            event.venues?.some((venue: any) =>
                              venue.users?.some((user: any) => user._id === this.userId)
                            )
                          );
                          
                          this.eventList = filteredEvents;
                          this.backupEventList = filteredEvents;
                        } else {
                          this.showError = true;
                          setTimeout(() => {
                            this.showError = false;
                          }, 3000);
                        }
                        
                        this.loading = false;
                      },
                      error: (err: any) => {
                        this.loading = false;
                        this.showError = true;
                        setTimeout(() => {
                          this.showError = false;
                        }, 3000);
                      }
                    });
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
                }
              });
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
          }
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

    this.orderForm = this.formBuilder.group({
      products: this.formBuilder.array([this.createItemForm()]),
      eventId: ['', Validators.required],
      venueId: ['', Validators.required],
      priority: ['medium', Validators.required],
      notes: [''],
    });
  }
  // Form array getter
  get products(): FormArray {
    return this.orderForm.get('products') as FormArray;
  }

  openOrderDetails(order: any) {
    this.selectedOrder = order;
  }

  createItemForm(): FormGroup {
    return this.formBuilder.group({
      productId: ['', Validators.required],
      quantityRequested: [1, [Validators.required, Validators.min(1)]],
    });
  }

  users: any = [];

  addItem(): void {
    this.products.push(this.createItemForm());
  }

  // Add this method to approve order
  approveOrder(orderId: string): void {
    this.isUpdating = true;
    this.ordersService.approveOrder(orderId).subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.updateOrderStatus(orderId, 'approved');
          this.showSuccess = true;
          this.respMessage = 'Order approved successfully!';
        } else {
          this.showError = true;
          this.respMessage = resp.message || 'Failed to approve order';
        }
        this.isUpdating = false;
      },
      error: (err: any) => {
        this.showError = true;
        this.respMessage = 'Error approving order';
        this.isUpdating = false;
      }
    });
  }

  // Add this method to reject order
  rejectOrder(orderId: string): void {
    this.isUpdating = true;
    this.ordersService.rejectOrder(orderId).subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.updateOrderStatus(orderId, 'rejected');
          this.showSuccess = true;
          this.respMessage = 'Order rejected successfully!';
        } else {
          this.showError = true;
          this.respMessage = resp.message || 'Failed to reject order';
        }
        this.isUpdating = false;
      },
      error: (err: any) => {
        this.showError = true;
        this.respMessage = 'Error rejecting order';
        this.isUpdating = false;
      }
    });
  }

  // Add this method to issue order
  issueOrder(orderId: string): void {
    this.isUpdating = true;
    this.ordersService.issueOrder(orderId).subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.updateOrderStatus(orderId, 'issued');
          this.showSuccess = true;
          this.respMessage = 'Order issued successfully!';
        } else {
          this.showError = true;
          this.respMessage = resp.message || 'Failed to issue order';
        }
        this.isUpdating = false;
      },
      error: (err: any) => {
        this.showError = true;
        this.respMessage = 'Error issuing order';
        this.isUpdating = false;
      }
    });
  }

  // Helper method to update order status in the local array
  private updateOrderStatus(orderId: string, newStatus: string): void {
    const orderIndex = this.ordersList.findIndex(order => order._id === orderId);
    if (orderIndex !== -1) {
      this.ordersList[orderIndex].status = newStatus;
      
      // Also update backup list if needed
      const backupIndex = this.backupOrdersList.findIndex(order => order._id === orderId);
      if (backupIndex !== -1) {
        this.backupOrdersList[backupIndex].status = newStatus;
      }
    }
    
    // Hide alerts after 3 seconds
    setTimeout(() => {
      this.showSuccess = false;
      this.showError = false;
    }, 3000);
  }
  removeItem(index: number): void {
    this.products.removeAt(index);
  }

  onCloseModal() {
    this.orderForm.reset({
      eventId: '',
      venueId: '',
      priority: 'medium',
      notes: '',
    });

    // this.orderForm.get('venueId')?.disable();

    // Clear FormArray properly
    const productsArray = this.orderForm.get('products') as FormArray;
    while (productsArray.length !== 0) {
      productsArray.removeAt(0);
    }
    this.addItem();
  }

  getAvailableProducts(index: number) {
    if (!this.backupProductsList) return [];

    // Collect selected product IDs except current row
    const selectedIds = this.products.controls
      .map((control, i) =>
        i !== index ? control.get('productId')?.value : null
      )
      .filter((id) => id !== null);

    // Filter products that are NOT selected elsewhere
    return this.backupProductsList.filter((p) => !selectedIds.includes(p._id));
  }

  get canAddMore(): boolean {
    if (!this.backupProductsList || this.backupProductsList.length === 0) {
      return false;
    }

    const selectedIds = this.products.controls
      .map((control) => control.get('productId')?.value)
      .filter((id) => id !== null);

    const remaining = this.backupProductsList.length - selectedIds.length;

    return remaining > 1; // Enable only if more than 1 product is left
  }

  openAddOrder() {
    this.isEditMode = false;
    this.selectedOrderId = null;

    this.onCloseModal(); // reset form
  }

  openEditOrder(order: any) {
    this.isEditMode = true;
    this.selectedOrderId = order._id;

    this.onCloseModal(); // clear previous data first

    // Patch general fields
    this.orderForm.patchValue({
      priority: order.priority,
      notes: order.notes,
    });

    // Clear existing rows
    const productsArray = this.orderForm.get('products') as FormArray;
    while (productsArray.length !== 0) {
      productsArray.removeAt(0);
    }

    // Add & patch each product row
    order.items.forEach((item: any) => {
      const row = this.createItemForm();

      row.patchValue({
        productId: item.productId?._id || '',
        quantityRequested: item.quantityRequested,
      });

      productsArray.push(row);
    });
  }

  onEventChange(event: any) {
    const selectedEventId = event.target.value;

    const selectedEvent = this.eventList.find((e: any) => e._id === selectedEventId);

    if (!selectedEvent || !selectedEvent.venues) {
      this.venuesList = [];
      // this.orderForm.get('venueId')?.disable();
      return;
    }

    const eventVenueIds = selectedEvent.venues.map((v: any) => v._id || v);
    
    this.venuesList = this.backupVenuesList.filter((venue: any) =>
      eventVenueIds.includes(venue._id)
    );

    if (this.venuesList.length > 0) {
      this.orderForm.get('venueId')?.enable();
    } else {
      this.orderForm.get('venueId')?.disable();
    }
  }

  toggleSelectAll(event: any) {
    this.selectAll = event.target.checked;
    this.selectedOrders.clear();

    if (this.selectAll) {
      this.ordersList.forEach((order) => this.selectedOrders.add(order._id));
    }
  }

  toggleOrderSelection(event: any, orderId: string) {
    if (event.target.checked) {
      this.selectedOrders.add(orderId);
    } else {
      this.selectedOrders.delete(orderId);
      this.selectAll = false; // uncheck master checkbox
    }

    // If all items selected → auto check the master checkbox
    if (this.selectedOrders.size === this.ordersList.length) {
      this.selectAll = true;
    }
  }

  getSelectedOrders() {
    return this.ordersList.filter((o) => this.selectedOrders.has(o._id));
  }

  // Submit final order
  submitOrder(): void {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const payload = this.orderForm.getRawValue();
    payload.items = payload.products;

    this.ordersService
      .createUpdateOrder(payload, this.isEditMode, this.selectedOrderId)
      .subscribe({
        next: (resp: any) => {
          this.respMessage = resp.message;
          if (resp.success === true) {
            if (!this.isEditMode) {
              // CREATE
              const newOrder = resp.data.order;
              this.ordersList.unshift(newOrder);
            } else {
              // EDIT
              const updatedOrder = resp.data.order;
              const updatedId = String(updatedOrder._id);
              const index = this.ordersList.findIndex(
                (o) => String(o._id) === updatedId
              );

              if (index !== -1) {
                this.ordersList[index] = updatedOrder;
              } else {
                // Fallback (if mismatch)
                this.ordersList.unshift(updatedOrder);
              }

              // $('#dataTable').DataTable().destroy();
              // setTimeout(() => {
              //   this.dataTable = new DataTable('#dataTable', {
              //     paging: true,
              //     searching: true,
              //     info: true,
              //   });
              // }, 100);
            }

            this.showSuccess = true;
            setTimeout(() => {
              this.showSuccess = false;
            }, 3000);

            const modalEl = document.getElementById('orderModal');
            const modalInstance =
              bootstrap.Modal.getInstance(modalEl) ||
              new bootstrap.Modal(modalEl);
            modalInstance.hide();
            // Reset modal form
            this.onCloseModal();
          } else {
            // API returned success:false
            this.showError = true;
            setTimeout(() => {
              this.showError = false;
            }, 3000);
          }

          this.loading = false;
        },

        error: (err: any) => {
          this.loading = false;
          this.showError = true;

          setTimeout(() => {
            this.showError = false;
          }, 3000);
        },
      });
  }

  printReciept(order: any) {}
}

