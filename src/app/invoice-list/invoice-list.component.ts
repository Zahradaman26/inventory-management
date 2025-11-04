import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [BreadcrumbComponent, RouterModule,CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './invoice-list.component.html',
  styleUrl: './invoice-list.component.css',
})
export class InvoiceListComponent {
  title = 'Invoice List';
  invoices = [
    {
      id: 1,
      invoiceNumber: '#526534',
      name: 'Kathryn Murphy',
      avatar: 'assets/images/user-list/user-list1.png',
      issuedDate: '25 Jan 2024',
      amount: '$200.00',
      status: 'Paid',
    },
    {
      id: 2,
      invoiceNumber: '#696589',
      name: 'Annette Black',
      avatar: 'assets/images/user-list/user-list2.png',
      issuedDate: '25 Jan 2024',
      amount: '$200.00',
      status: 'Paid',
    },
    {
      id: 3,
      invoiceNumber: '#256584',
      name: 'Ronald Richards',
      avatar: 'assets/images/user-list/user-list3.png',
      issuedDate: '10 Feb 2024',
      amount: '$200.00',
      status: 'Paid',
    },
    {
      id: 4,
      invoiceNumber: '#526587',
      name: 'Eleanor Pena',
      avatar: 'assets/images/user-list/user-list4.png',
      issuedDate: '10 Feb 2024',
      amount: '$150.00',
      status: 'Paid',
    },
    {
      id: 5,
      invoiceNumber: '#105986',
      name: 'Leslie Alexander',
      avatar: 'assets/images/user-list/user-list5.png',
      issuedDate: '15 March 2024',
      amount: '$150.00',
      status: 'Pending',
    },
    {
      id: 6,
      invoiceNumber: '#526589',
      name: 'Albert Flores',
      avatar: 'assets/images/user-list/user-list6.png',
      issuedDate: '15 March 2024',
      amount: '$150.00',
      status: 'Paid',
    },
    {
      id: 7,
      invoiceNumber: '#526520',
      name: 'Jacob Jones',
      avatar: 'assets/images/user-list/user-list7.png',
      issuedDate: '27 April 2024',
      amount: '$250.00',
      status: 'Paid',
    },
    {
      id: 8,
      invoiceNumber: '#256584',
      name: 'Jerome Bell',
      avatar: 'assets/images/user-list/user-list8.png',
      issuedDate: '27 April 2024',
      amount: '$250.00',
      status: 'Pending',
    },
    {
      id: 9,
      invoiceNumber: '#200257',
      name: 'Marvin McKinney',
      avatar: 'assets/images/user-list/user-list9.png',
      issuedDate: '30 April 2024',
      amount: '$250.00',
      status: 'Paid',
    },
    {
      id: 10,
      invoiceNumber: '#526525',
      name: 'Cameron Williamson',
      avatar: 'assets/images/user-list/user-list10.png',
      issuedDate: '30 April 2024',
      amount: '$250.00',
      status: 'Paid',
    },
  ];
}
