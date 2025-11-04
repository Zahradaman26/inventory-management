import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-invoice-edit',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './invoice-edit.component.html',
  styleUrl: './invoice-edit.component.css'
})
export class InvoiceEditComponent {
  title = 'Invoice Edit';
}
