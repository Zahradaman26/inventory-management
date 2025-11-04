import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-notification-alert',
  standalone: true,
  imports: [BreadcrumbComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './notification-alert.component.html',
  styleUrl: './notification-alert.component.css'
})
export class NotificationAlertComponent {
  title = 'Notification Alert';
}
