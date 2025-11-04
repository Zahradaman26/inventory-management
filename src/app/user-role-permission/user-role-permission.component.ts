import { AfterViewInit, Component } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import DataTable from 'datatables.net';

@Component({
  selector: 'app-user-role-permission',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, FormsModule],
  templateUrl: './user-role-permission.component.html',
  styleUrls: ['./user-role-permission.component.css'] 
})
export class UserRolePermissionComponent implements AfterViewInit {

  users = [
    { name: 'Kathryn Murphy', email: 'kathrynmurphy@gmail.com', status: 'Active', role: 'Manager', access: 'Full Access', location: 'Mikel Roads, Port Arnoldo, ID', img: 'assets/images/user-list/user-list1.png', visible: true },
    { name: 'Kathryn Murphy', email: 'kathryn.murphy@example.com', status: 'Active', role: 'Employee', access: 'Full Access', location: 'New York, USA', img: 'assets/images/user-list/user-list3.png', visible: true },
    { name: 'Devon Lane', email: 'devon.lane@example.com', status: 'Inactive', role: 'Admin', access: 'Hosts', location: 'Los Angeles, USA', img: 'assets/images/user-list/user-list2.png', visible: true },
    { name: 'Leslie Alexander', email: 'leslie.alexander@example.com', status: 'Active', role: 'Employee', access: 'View Only', location: 'New York, USA', img: 'assets/images/user-list/user-list5.png', visible: true },
    { name: 'Cameron Williamson', email: 'cameron.williamson@example.com', status: 'Pending', role: 'Owner', access: 'Accounting', location: 'Chicago, USA', img: 'assets/images/user-list/user-list4.png', visible: true },
    { name: 'Leslie Alexander', email: 'leslie.alexander@example.com', status: 'Active', role: 'Employee', access: 'View Only', location: 'New York, USA', img: 'assets/images/user-list/user-list7.png', visible: true },
    { name: 'Cameron Williamson', email: 'cameron.williamson@example.com', status: 'Pending', role: 'Owner', access: 'Accounting', location: 'Chicago, USA', img: 'assets/images/user-list/user-list6.png', visible: true },
    { name: 'Leslie Alexander', email: 'leslie.alexander@example.com', status: 'Inactive', role: 'Admin', access: 'Hosts', location: 'Los Angeles, USA', img: 'assets/images/user-list/user-list5.png', visible: true }
  ];

  roles = ['Manager', 'Admin', 'Employee', 'Owner', 'Staff', 'Host', 'Analyst'];
  accessLevels = ['Full Access', 'Hosts', 'View Only', 'Accounting', 'Management'];

  ngAfterViewInit(): void {
    new DataTable('#dataTable');
  }

 
}
