import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [BreadcrumbComponent, RouterLink,CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './users-list.component.html',
  styleUrl: './users-list.component.css'
})
export class UsersListComponent {
  title = 'Users Grids';
  users= [
    {
      id: 1,
      date: '25 Jan 2024',
      imgSrc: 'assets/images/user-list/user-list1.png',
      name: 'Kathryn Murphy',
      email: 'osgoodwy@gmail.com',
      department: 'HR',
      position: 'Manager',
      status: 'Active'
    },
    {
      id: 2,
      date: '12 Jan 2024',
      imgSrc: 'assets/images/user-list/user-list2.png',
      name: 'Annette Black',
      email: 'redaniel@gmail.com',
      department: 'Design',
      position: 'UI UX Designer',
      status: 'Inactive'
    },
    {
      id: 3,
      date: '25 Oct 2024',
      imgSrc: 'assets/images/user-list/user-list3.png',
      name: 'Dianne Russell',
      email: 'russell@gmail.com',
      department: 'Development',
      position: 'Frontend developer',
      status: 'Active'
    },
    {
      id: 4,
      date: '04 Jan 2024',
      imgSrc: 'assets/images/user-list/user-list4.png',
      name: 'Kathryn Murphy',
      email: 'osgoodwy@gmail.com',
      department: 'HR',
      position: 'Manager',
      status: 'Active'
    },
    {
      id: 5,
      date: '19 Jan 2024',
      imgSrc: 'assets/images/user-list/user-list5.png',
      name: 'Annette Black',
      email: 'redaniel@gmail.com',
      department: 'Design',
      position: 'UI UX Designer',
      status: 'Inactive'
    },
    {
      id: 7,
      date: '17 Oct 2024',
      imgSrc: 'assets/images/user-list/user-list7.png',
      name: 'Dianne Russell',
      email: 'russell@gmail.com',
      department: 'Development',
      position: 'Frontend developer',
      status: 'Active'
    },
    {
      id: 8,
      date: '05 Jan 2025',
      imgSrc: 'assets/images/user-list/user-list8.png',
      name: 'Kathryn Murphy',
      email: 'osgoodwy@gmail.com',
      department: 'HR',
      position: 'Manager',
      status: 'Active'
    },
    {
      id: 9,
      date: '11 Feb 2024',
      imgSrc: 'assets/images/user-list/user-list6.png',
      name: 'Annette Black',
      email: 'redaniel@gmail.com',
      department: 'Design',
      position: 'UI UX Designer',
      status: 'Inactive'
    },
    {
      id: 10,
      date: '17 Oct 2024',
      imgSrc: 'assets/images/user-list/user-list9.png',
      name: 'Dianne Russell',
      email: 'russell@gmail.com',
      department: 'Development',
      position: 'Frontend developer',
      status: 'Active'
    },
    // ... add all other users here similarly ...
  ];

}
