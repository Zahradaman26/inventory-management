import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-warehouses',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink,CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './warehouses.component.html',
  styleUrl: './warehouses.component.css'
})
export class WarehousesComponent {
  title = 'Users Grids';
  users= [
    {
      id: 1,
      warehouse: 'Begumwadi',
      imgSrc: 'assets/images/user-list/user-list1.png',
      name: 'Kathryn Murphy',
      phone: '0000-1111-55',
      totalProducts: 10,
      stock: 600,
      quantity: 12,
      createdOn: '25 Jan 2024',
      status: 'Active'
    },
    {
      id: 2,
      warehouse: 'Begumwadi',
      imgSrc: 'assets/images/user-list/user-list2.png',
      name: 'Kathryn Murphy',
      phone: '0000-1111-55',
      totalProducts: 10,
      stock: 600,
      quantity: 12,
      createdOn: '25 Jan 2024',
      status: 'Active'
    },
    {
      id: 3,
      warehouse: 'Begumwadi',
      imgSrc: 'assets/images/user-list/user-list3.png',
      name: 'Kathryn Murphy',
      phone: '0000-1111-55',
      totalProducts: 10,
      stock: 600,
      quantity: 12,
      createdOn: '25 Jan 2024',
      status: 'Active'
    },
    {
      id: 4,
      warehouse: 'Begumwadi',
      imgSrc: 'assets/images/user-list/user-list1.png',
      name: 'Kathryn Murphy',
      phone: '0000-1111-55',
      totalProducts: 10,
      stock: 600,
      quantity: 12,
      createdOn: '25 Jan 2024',
      status: 'Active'
    },
    {
      id: 5,
      warehouse: 'Begumwadi',
      imgSrc: 'assets/images/user-list/user-list1.png',
      name: 'Kathryn Murphy',
      phone: '0000-1111-55',
      totalProducts: 10,
      stock: 600,
      quantity: 12,
      createdOn: '25 Jan 2024',
      status: 'Active'
    },
  ];

}
