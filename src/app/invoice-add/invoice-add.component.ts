import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-invoice-add',
  standalone: true,
  imports: [BreadcrumbComponent,CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './invoice-add.component.html',
  styleUrls: ['./invoice-add.component.css']
})
export class InvoiceAddComponent  {
  title = 'Invoice Add';
  invoiceItems = [
    { name: "Apple's Shoes", quantity: 5, unit: 'PC', price: 200, total: 1000 },
    { name: "Apple's Shoes", quantity: 5, unit: 'PC', price: 200, total: 1000 },
    { name: "Apple's Shoes", quantity: 5, unit: 'PC', price: 200, total: 1000 },
    { name: "Apple's Shoes", quantity: 5, unit: 'PC', price: 200, total: 1000 }
  ];
  removeRow(index: number): void {
    this.invoiceItems.splice(index, 1);
  }
  addRow() {
    this.invoiceItems.push({
      name: 'New Item',
      quantity: 1,
      unit: 'PC',
      price: 1000,
      total: 1000
    });
  }
}
