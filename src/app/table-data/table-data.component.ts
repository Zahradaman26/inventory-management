import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import DataTable from 'datatables.net';
@Component({
  selector: 'app-table-data',
  standalone: true,
  imports: [BreadcrumbComponent,CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './table-data.component.html',
  styleUrl: './table-data.component.css'
})
export class TableDataComponent implements AfterViewInit {
  title = 'Basic Table';
  constructor() { }

  ngAfterViewInit() {
    new DataTable('#dataTable');
  }
  users = [
    { id: 1, code: '#526534', name: 'Kathryn Murphy', img: 'assets/images/user-list/user-list1.png', date: '25 Jan 2024', amount: '$200.00', status: 'Paid' },
    { id: 2, code: '#696589', name: 'Annette Black', img: 'assets/images/user-list/user-list2.png', date: '25 Jan 2024', amount: '$200.00', status: 'Paid' },
    { id: 3, code: '#256584', name: 'Ronald Richards', img: 'assets/images/user-list/user-list3.png', date: '10 Feb 2024', amount: '$200.00', status: 'Paid' },
    { id: 4, code: '#526587', name: 'Eleanor Pena', img: 'assets/images/user-list/user-list4.png', date: '10 Feb 2024', amount: '$150.00', status: 'Paid' },
    { id: 5, code: '#105986', name: 'Leslie Alexander', img: 'assets/images/user-list/user-list5.png', date: '15 March 2024', amount: '$150.00', status: 'Pending' },
    { id: 6, code: '#526589', name: 'Albert Flores', img: 'assets/images/user-list/user-list6.png', date: '15 March 2024', amount: '$150.00', status: 'Paid' },
    { id: 7, code: '#526520', name: 'Jacob Jones', img: 'assets/images/user-list/user-list7.png', date: '27 April 2024', amount: '$250.00', status: 'Paid' },
    { id: 8, code: '#256584', name: 'Jerome Bell', img: 'assets/images/user-list/user-list8.png', date: '27 April 2024', amount: '$250.00', status: 'Pending' },
    { id: 9, code: '#200257', name: 'Marvin McKinney', img: 'assets/images/user-list/user-list9.png', date: '30 April 2024', amount: '$250.00', status: 'Paid' },
    { id: 10, code: '#526534', name: 'Kathryn Murphy', img: 'assets/images/user-list/user-list1.png', date: '25 Jan 2024', amount: '$200.00', status: 'Paid' },
    { id: 11, code: '#200257', name: 'Marvin McKinney', img: 'assets/images/user-list/user-list9.png', date: '30 April 2024', amount: '$250.00', status: 'Paid' },
    { id: 12, code: '#696589', name: 'Annette Black', img: 'assets/images/user-list/user-list2.png', date: '25 Jan 2024', amount: '$200.00', status: 'Paid' },
    { id: 13, code: '#256584', name: 'Ronald Richards', img: 'assets/images/user-list/user-list3.png', date: '10 Feb 2024', amount: '$200.00', status: 'Paid' },
    { id: 14, code: '#526587', name: 'Eleanor Pena', img: 'assets/images/user-list/user-list4.png', date: '10 Feb 2024', amount: '$150.00', status: 'Paid' },
    { id: 15, code: '#105986', name: 'Leslie Alexander', img: 'assets/images/user-list/user-list5.png', date: '15 March 2024', amount: '$150.00', status: 'Pending' },
    { id: 16, code: '#526589', name: 'Albert Flores', img: 'assets/images/user-list/user-list6.png', date: '15 March 2024', amount: '$150.00', status: 'Paid' },
    { id: 17, code: '#526520', name: 'Jacob Jones', img: 'assets/images/user-list/user-list7.png', date: '27 April 2024', amount: '$250.00', status: 'Paid' },
    { id: 18, code: '#256584', name: 'Jerome Bell', img: 'assets/images/user-list/user-list8.png', date: '27 April 2024', amount: '$250.00', status: 'Pending' },
    { id: 19, code: '#200257', name: 'Marvin McKinney', img: 'assets/images/user-list/user-list9.png', date: '30 April 2024', amount: '$250.00', status: 'Paid' }
  ];
}
