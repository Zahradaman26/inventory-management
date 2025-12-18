import { CommonModule, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  ChangeDetectorRef
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
import { forkJoin } from 'rxjs';
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
  
  // Pagination and filtering
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  searchTerm = '';
  statusFilter = '';

  rejectOrderForm!: FormGroup;
  selectedOrderForRejection: any = null;
  rejectFormSubmitted = false;

  priorityOrder: Record<string, number> = {
    urgent: 1,
    high: 2,
    medium: 3,
    low: 4,
  };

  statusOrder: Record<string, number> = {
    requested: 1,
    approved: 2,
    issued: 3,
  };

  isUpdating = false;
  
  // Debug properties
  debugVenuesCount: number = 0;
  debugEventsCount: number = 0;

  constructor(
    private formBuilder: FormBuilder,
    private productService: ProductService,
    private ordersService: OrdersService,
    private authService: AuthService,
    private venuesService: VenuesService,
    private eventsService: EventsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      const parsed = JSON.parse(userData);
      this.userId = parsed._id;
    } else {
      this.authService.logout();
    }

    this.orderForm = this.formBuilder.group({
      products: this.formBuilder.array([this.createItemForm()]),
      eventId: ['', Validators.required],
      venueId: ['', Validators.required],
      priority: ['medium', Validators.required],
      notes: [''],
    });

    this.initRejectOrderForm();
    this.loadAllData();
  }

  // Form array getter
  get products(): FormArray {
    return this.orderForm.get('products') as FormArray;
  }

  initRejectOrderForm() {
    this.rejectOrderForm = this.formBuilder.group({
      rejectionReason: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  loadAllData(): void {
    this.loading = true;
    
    forkJoin({
      orders: this.ordersService.getAllOrders(),
      products: this.productService.getAllProducts(),
      venues: this.venuesService.getVenues(),
      events: this.eventsService.getEvents()
    }).subscribe({
      next: (responses: any) => {
        console.log('API Responses:', responses); // Debug log
        
        // Handle orders
        if (responses.orders.success === true) {
          this.ordersList = responses.orders.data.orders;
          this.backupOrdersList = responses.orders.data.orders;
          this.sortOrders();
          this.initializeDataTable();
        }
        
        // Handle products
        if (responses.products.success === true) {
          this.productsList = responses.products.data.products;
          this.backupProductsList = responses.products.data.products;
        }
        
        // Handle venues - CRITICAL FIX
        if (responses.venues.success === true) {
          const venues = responses.venues.data?.venues ?? responses.venues.data ?? [];
          console.log('Venues loaded:', venues); // Debug log
          this.venuesList = venues;
          this.backupVenuesList = venues;
          this.debugVenuesCount = venues.length;
        }
        
        // Handle events
        if (responses.events.success === true) {
          const events = responses.events.data?.events ?? responses.events.data ?? [];
          console.log('Events loaded:', events); // Debug log
          this.eventList = events;
          this.backupEventList = events;
          this.debugEventsCount = events.length;
        }

        this.loading = false;
        this.cdr.detectChanges(); // Force change detection
      },
      error: (error: any) => {
        console.error('Error loading data:', error);
        this.loading = false;
        this.showError = true;
        this.respMessage = 'Error loading data';
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      }
    });
  }

  initializeDataTable(): void {
    setTimeout(() => {
      this.dataTable = new DataTable('#dataTable', {
        paging: true,
        searching: true,
        info: true,
        ordering: false,
      });

      this.setupTableFilters();
    }, 100);
  }

  setupTableFilters(): void {
    document.getElementById('dateFilter')?.addEventListener('change', (e) => {
      const value = (e.target as HTMLInputElement).value;
      if (value) {
        const formatted = new Date(value).toLocaleDateString('en-US');
        this.dataTable.column(4).search(formatted).draw();
      } else {
        this.dataTable.column(4).search('').draw();
      }
    });

    document.getElementById('priorityFilter')?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.dataTable.column(6).search(value).draw();
    });

    document.getElementById('statusFilter')?.addEventListener('change', (e) => {
      const value = (e.target as HTMLSelectElement).value;
      this.dataTable.column(7).search(value).draw();
    });
  }

  sortOrders(): void {
    this.ordersList.sort((a: any, b: any) => {
      const priorityDiff =
        (this.priorityOrder[a.priority] ?? 99) -
        (this.priorityOrder[b.priority] ?? 99);

      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      return (
        (this.statusOrder[a.status] ?? 99) -
        (this.statusOrder[b.status] ?? 99)
      );
    });
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

  getVenueIdFromOrder(orderId: string): string {
    const order = this.ordersList.find(order => order._id === orderId);
    if (!order) return '';
    
    const venueId = 
        order?.venue?._id ||
        order?.venueId?._id ||
        order?.venueId ||
        order?.venue ||
        '';
    
    return venueId;
  }

  addItem(): void {
    this.products.push(this.createItemForm());
  }

  getEventName(order: any): string {
    return (
      order?.eventId?.name ||
      order?.eventId?.eventName ||
      order?.event?.name ||
      '—'
    );
  }

  getVenueName(order: any): string {
    const venueName = 
        order?.venue?.name || 
        order?.venue?.venueName ||
        order?.venueId?.name ||
        order?.venueId?.venueName ||
        '—';
    
    if (venueName === '—' && order?.venueId) {
        const venueId = typeof order.venueId === 'string' ? order.venueId : order.venueId._id;
        const venue = this.backupVenuesList.find((v: any) => v._id === venueId);
        if (venue) {
            return venue.name || venue.venueName || '—';
        }
    }
    
    return venueName;
  }

  approveOrder(orderId: string): void {
    const venueId = this.getVenueIdFromOrder(orderId);
    
    if (!venueId) {
      this.showError = true;
      this.respMessage = 'Cannot approve order: Venue information is missing';
      setTimeout(() => {
        this.showError = false;
      }, 3000);
      return;
    }

    this.isUpdating = true;
    this.ordersService.approveOrder(orderId, venueId).subscribe({
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
        
        setTimeout(() => {
          this.showSuccess = false;
          this.showError = false;
        }, 3000);
      },
      error: (err: any) => {
        this.showError = true;
        this.respMessage = err || 'Error approving order';
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      }
    });
  }

  rejectOrder(): void {
    this.rejectFormSubmitted = true;
    
    if (this.rejectOrderForm.invalid) {
      this.rejectOrderForm.markAllAsTouched();
      return;
    }
    
    const orderId = this.selectedOrderForRejection._id;
    const rejectionReason = this.rejectOrderForm.value.rejectionReason;

    this.isUpdating = true;
    this.ordersService.rejectOrder(orderId, rejectionReason).subscribe({
      next: (resp: any) => {
        if (resp.success === true) {
          this.updateOrderStatus(orderId, 'rejected');
          this.showSuccess = true;
          this.respMessage = 'Order rejected successfully!';
          this.closeRejectModal();
        } else {
          this.showError = true;
          this.respMessage = resp.message || 'Failed to reject order';
        }
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showSuccess = false;
          this.showError = false;
        }, 3000);
      },
      error: (err: any) => {
        this.showError = true;
        this.respMessage = err.error?.message || 'Error rejecting order';
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      }
    });
  }

  issueOrder(orderId: string): void {
    const venueId = this.getVenueIdFromOrder(orderId);
    
    if (!venueId) {
      this.showError = true;
      this.respMessage = 'Cannot issue order: Venue information is missing';
      setTimeout(() => {
        this.showError = false;
      }, 3000);
      return;
    }

    this.isUpdating = true;
    this.ordersService.issueOrder(orderId, venueId).subscribe({
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
        
        setTimeout(() => {
          this.showSuccess = false;
          this.showError = false;
        }, 3000);
      },
      error: (err: any) => {
        this.showError = true;
        this.respMessage = err || 'Error issuing order';
        this.isUpdating = false;
        
        setTimeout(() => {
          this.showError = false;
        }, 3000);
      }
    });
  }

  private updateOrderStatus(orderId: string, newStatus: string): void {
    const orderIndex = this.ordersList.findIndex(order => order._id === orderId);
    if (orderIndex !== -1) {
      this.ordersList[orderIndex].status = newStatus;
      
      const backupIndex = this.backupOrdersList.findIndex(order => order._id === orderId);
      if (backupIndex !== -1) {
        this.backupOrdersList[backupIndex].status = newStatus;
      }
    }
    
    setTimeout(() => {
      this.showSuccess = false;
      this.showError = false;
    }, 3000);
  }

  removeItem(index: number): void {
    this.products.removeAt(index);
  }

  onCloseModal() {
    console.log('Closing modal, resetting form...');
    
    // Reset form
    this.orderForm.reset({
      eventId: '',
      venueId: '',
      priority: 'medium',
      notes: '',
    });

    // Reset edit mode
    this.isEditMode = false;
    this.selectedOrderId = null;

    // Enable venue control
    this.orderForm.get('venueId')?.enable();

    // Clear and reset products array
    const productsArray = this.orderForm.get('products') as FormArray;
    while (productsArray.length > 0) {
      productsArray.removeAt(0);
    }
    this.addItem();
    
    // Reset venues to show all venues
    this.venuesList = [...this.backupVenuesList];
    console.log('Venues list reset to:', this.venuesList);
    
    this.cdr.detectChanges();
  }

  getAvailableProducts(index: number) {
    if (!this.backupProductsList) return [];

    const selectedIds = this.products.controls
      .map((control, i) =>
        i !== index ? control.get('productId')?.value : null
      )
      .filter((id) => id !== null);

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

    return remaining > 1;
  }

  openAddOrder() {
    console.log('Opening add order modal');
    this.isEditMode = false;
    this.selectedOrderId = null;

    this.onCloseModal(); // reset form
  }

  openEditOrder(order: any) {
    console.log('Opening edit order for:', order);

    this.isEditMode = true;
    this.selectedOrderId = order._id;

    // ✅ DO NOT call onCloseModal here
    this.resetFormForEdit();

    // ----------------------------
    // Extract eventId & venueId
    // ----------------------------
    const eventId =
      typeof order.eventId === 'string'
        ? order.eventId
        : order.eventId?._id || '';

    const venueId =
      order.venue?._id ||
      order.venueId?._id ||
      (typeof order.venueId === 'string' ? order.venueId : '') ||
      (typeof order.venue === 'string' ? order.venue : '');

    // ----------------------------
    // Patch basic fields
    // ----------------------------
    this.orderForm.patchValue({
      eventId,
      priority: order.priority || 'medium',
      notes: order.notes || '',
    });

    // ----------------------------
    // Load venues for selected event
    // ----------------------------
    this.loadVenuesForEvent(eventId);

    // ✅ PATCH VENUE ONLY AFTER OPTIONS EXIST
    this.orderForm.patchValue({
      venueId
    });

    // ----------------------------
    // Load products
    // ----------------------------
    const productsArray = this.orderForm.get('products') as FormArray;
    productsArray.clear();

    order.items?.forEach((item: any) => {
      const row = this.createItemForm();
      row.patchValue({
        productId: item.productId?._id || item.productId,
        quantityRequested: item.quantityRequested || 1,
      });
      productsArray.push(row);
    });

    this.cdr.detectChanges();
  }


  // FIXED: Simplified venue loading
  // UPDATED: Better venue loading with proper ID comparison
  loadVenuesForEvent(eventId: string) {

    if (!eventId) {
      this.venuesList = [...this.backupVenuesList];
      return;
    }

    const selectedEvent = this.eventList.find(
      (e: any) => e._id === eventId
    );

    if (!selectedEvent || !selectedEvent.venues?.length) {
      this.venuesList = [...this.backupVenuesList];
      return;
    }

    const eventVenueIds = selectedEvent.venues.map((v: any) =>
      typeof v === 'string' ? v : v._id
    );

    this.venuesList = this.backupVenuesList.filter((v: any) =>
      eventVenueIds.includes(v._id)
    );
  }


 
  // Helper method to add missing venue
  addMissingVenue(order: any, venueId: string) {
    console.log('Adding missing venue:', venueId);
    
    let venueName = 'Unknown Venue';
    
    if (order.venue && order.venue.name) {
      venueName = order.venue.name;
    } else if (order.venueId && order.venueId.name) {
      venueName = order.venueId.name;
    } else if (order.venue && order.venue.venueName) {
      venueName = order.venue.venueName;
    } else if (order.venueId && order.venueId.venueName) {
      venueName = order.venueId.venueName;
    }
    
    console.log('Venue name determined as:', venueName);

    const missingVenue = {
      _id: venueId,
      name: venueName,
      venueName: venueName
    };

    // Add to venuesList if not already there
    const venueExists = this.venuesList.some((v: any) => v._id === venueId);
    if (!venueExists) {
      this.venuesList.push(missingVenue);
      console.log('Added venue to venuesList');
    }
    
    // Also add to backup list
    const backupExists = this.backupVenuesList.some((v: any) => v._id === venueId);
    if (!backupExists) {
      this.backupVenuesList.push(missingVenue);
      console.log('Added venue to backupVenuesList');
    }
    
    this.cdr.detectChanges();
  }

  onEventChange(event: any) {
    const selectedEventId = event.target.value;
    console.log('Event changed to:', selectedEventId);
    
    // Clear venue selection
    this.orderForm.patchValue({ venueId: '' });
    
    // Load venues for this event
    this.loadVenuesForEvent(selectedEventId);
  }

  private resetFormForEdit() {
    this.orderForm.reset({
      eventId: '',
      venueId: '',
      priority: 'medium',
      notes: '',
    });

    const productsArray = this.orderForm.get('products') as FormArray;
    productsArray.clear();
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
      this.selectAll = false;
    }

    if (this.selectedOrders.size === this.ordersList.length) {
      this.selectAll = true;
    }
  }

  getSelectedOrders() {
    return this.ordersList.filter((o) => this.selectedOrders.has(o._id));
  }

  openRejectModal(order: any): void {
    this.selectedOrderForRejection = order;
    this.rejectFormSubmitted = false;
    this.rejectOrderForm.reset();
  }

  closeRejectModal(): void {
    this.selectedOrderForRejection = null;
    this.rejectFormSubmitted = false;
    this.rejectOrderForm.reset();
    
    const modal = document.getElementById('rejectOrderModal');
    if (modal) {
      const bsModal = bootstrap.Modal.getInstance(modal) || new bootstrap.Modal(modal);
      bsModal.hide();
    }
  }

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
              const newOrder = resp.data.order;
              this.ordersList.unshift(newOrder);
            } else {
              const updatedOrder = resp.data.order;
              const updatedId = String(updatedOrder._id);
              const index = this.ordersList.findIndex(
                (o) => String(o._id) === updatedId
              );

              if (index !== -1) {
                this.ordersList[index] = updatedOrder;
              } else {
                this.ordersList.unshift(updatedOrder);
              }
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
            
            this.onCloseModal();
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
          this.respMessage = err.error?.message || 'Error saving order';

          setTimeout(() => {
            this.showError = false;
          }, 3000);
        },
      });
  }

  printReciept(order: any) {}
}