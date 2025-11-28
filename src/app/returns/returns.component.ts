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
