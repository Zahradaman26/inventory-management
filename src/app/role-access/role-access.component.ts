import { AfterViewInit, Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-role-access',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './role-access.component.html',
  styleUrl: './role-access.component.css'
})
export class RoleAccessComponent {
  title = 'Role Access';
  constructor() { }


  rows = [
    {
      id: 1,
      date: '25 Jan 2024',
      role: 'Test',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Active',
      statusClass: 'bg-success-focus text-success-600 border border-success-main',
      visible: true,
    },
    {
      id: 2,
      date: '25 Jan 2024',
      role: 'Waiter',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Inactive',
      statusClass: 'bg-danger-focus text-danger-600 border border-danger-main',
      visible: true,
    },
    {
      id: 3,
      date: '25 Aug 2024',
      role: 'Test',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Active',
      statusClass: 'bg-success-focus text-success-600 border border-success-main',
      visible: true,
    },
    {
      id: 3,
      date: '12 Feb 2024',
      role: 'Manger',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Inactive',
      statusClass: 'bg-danger-focus text-danger-600 border border-danger-main',
      visible: true,
    },
    {
      id: 4,
      date: '17 Sep 2024',
      role: 'Admin',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Active',
      statusClass: 'bg-success-focus text-success-600 border border-success-main',
      visible: true,
    },
    {
      id: 5,
      date: '25 Jan 2024',
      role: 'Waiter',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Inactive',
      statusClass: 'bg-danger-focus text-danger-600 border border-danger-main',
      visible: true,
    },
    {
      id: 6,
      date: '9 March 2024',
      role: 'Engineer',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Active',
      statusClass: 'bg-success-focus text-success-600 border border-success-main',
      visible: true,
    },
    {
      id: 7,
      date: '26 Nov 2024',
      role: 'Admin',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Inactive',
      statusClass: 'bg-danger-focus text-danger-600 border border-danger-main',
      visible: true,
    },
    {
      id: 8,
      date: '25 Jan 2024',
      role: 'Test',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Active',
      statusClass: 'bg-success-focus text-success-600 border border-success-main',
      visible: true,
    },
    {
      id: 9,
      date: '30 April 2024',
      role: 'Waiter',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Inactive',
      statusClass: 'bg-danger-focus text-danger-600 border border-danger-main',
      visible: true,
    },
    {
      id: 10,
      date: '18 Dec 2024',
      role: 'Test',
      description: 'Lorem Ipsum is simply dummy text of the printing and typesetting',
      status: 'Active',
      statusClass: 'bg-success-focus text-success-600 border border-success-main',
      visible: true,
    },
  ];

  removeRow(id: number) {
    // Option 1: Hide row by setting visible false
    const row = this.rows.find(r => r.id === id);
    if (row) {
      row.visible = false;
    }
  }

}
