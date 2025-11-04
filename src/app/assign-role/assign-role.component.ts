import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-assign-role',
  standalone: true,
  imports: [BreadcrumbComponent, FormsModule, CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './assign-role.component.html',
  styleUrl: './assign-role.component.css'
})
export class AssignRoleComponent {
  title = 'Role and Access';
  users = [
    {
      id: 1,
      name: 'Kathryn Murphy',
      role: 'Waiter',
      image: 'assets/images/user-list/user-list1.png',
    },
    {
      id: 2,
      name: 'Annette Black',
      role: 'Manager',
      image: 'assets/images/user-list/user-list2.png',
    },
    {
      id: 3,
      name: 'Ronald Richards',
      role: 'Project Manager',
      image: 'assets/images/user-list/user-list3.png',
    },
    {
      id: 4,
      name: 'Eleanor Pena',
      role: 'Game Developer',
      image: 'assets/images/user-list/user-list4.png',
    },
    {
      id: 5,
      name: 'Leslie Alexander',
      role: 'Game Developer',
      image: 'assets/images/user-list/user-list5.png',
    },
    {
      id: 6,
      name: 'Albert Flores',
      role: 'Management',
      image: 'assets/images/user-list/user-list6.png',
    },
    {
      id: 7,
      name: 'Jacob Jones',
      role: 'Waiter',
      image: 'assets/images/user-list/user-list7.png',
    },
    {
      id: 8,
      name: 'Jerome Bell',
      role: 'Waiter',
      image: 'assets/images/user-list/user-list8.png',
    },
    {
      id: 9,
      name: 'Marvin McKinney',
      role: 'Waiter',
      image: 'assets/images/user-list/user-list9.png',
    },
    {
      id: 10,
      name: 'Cameron Williamson',
      role: 'Admin',
      image: 'assets/images/user-list/user-list10.png',
    },
  ];

  roles = ['Waiter', 'Manager', 'Project Manager', 'Game Developer', 'Head', 'Management','Admin'];

  selectedAll = false;

  toggleSelectAll(event: any) {
    this.selectedAll = event.target.checked;
    this.users.forEach(user => user['selected'] = this.selectedAll);
  }

  assignRole(user: any, role: string) {
    user.role = role;
  }
}
