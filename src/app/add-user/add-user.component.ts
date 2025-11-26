import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, ReactiveFormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css',
  providers: [UserService, DecimalPipe]
})
export class AddUserComponent implements OnInit {
  
  title: string = 'Add User';
  userForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  roles = ['Admin', 'User', 'Viewer'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.initializeForm()
  }

  initializeForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.minLength(10)]],
      role: ['', Validators.required],
      isActive: [true]
    });
  }

  get f() {
    return this.userForm.controls;
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userData = this.userForm.value;

    this.userService.addUser(userData).subscribe({
      next: (response) => {
        this.userForm.reset();
        this.loading = false;
        this.successMessage = 'User added successfully!';
        this.router.navigate(['/users-list']);
        
        // Redirect to products list after 2 seconds
        // setTimeout(() => {
        // }, 2000);
      },
      error: (error) => {
        console.error('Error adding user:', error);
        this.loading = false;
        this.errorMessage = error || 'Failed to add user. Please try again.';
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    })
  }
}
