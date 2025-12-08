import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, ReactiveFormsModule, RouterModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './add-user.component.html',
  styleUrl: './add-user.component.css',
})
export class AddUserComponent implements OnInit {
  
  title = 'Add User';
  userForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  isEditMode = false;
  userId: string | null = null;

  roles = ['super_admin', 'user', 'viewer'];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');

    if (this.userId) {
      this.isEditMode = true;
      this.title = 'Edit User';
      this.loadUserData();
    }
  }

  initializeForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.email]],
      password: ['', [Validators.minLength(6)]], // Remove required for edit mode
      contactNumber: ['', [Validators.required, Validators.minLength(10), Validators.pattern(/^\+[1-9]\d{1,14}$/)]],
      role: ['', Validators.required],
      isActive: [true]
    });
  }

  loadUserData(): void {
    this.loading = true;

    this.userService.getUserById(this.userId!).subscribe({
      next: (response) => {
        const user = response.data;
        this.userForm.patchValue({
          name: user.name,
          email: user.email,
          contactNumber: user.contactNumber,
          role: user.role,
          isActive: user.isActive
        });
        this.loading = false;
      },
      error: (error) => {
        // console.error('Error loading user:', error);
        this.loading = false;
        this.errorMessage = 'Failed to load user data';
      }
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
    
    const formData = { ...this.userForm.value };
    if (this.isEditMode && !formData.password) {
      delete formData.password;
    }

    if (this.isEditMode) {
      // Update existing user
      this.userService.updateUser(this.userId!, formData).subscribe({
        next: (response) => {

          this.loading = false;
          this.successMessage = 'User updated successfully!';
          setTimeout(() => {
            this.router.navigate(['/users-list']);
          }, 1500);
        },
        error: (error) => {
          // console.error('Error updating user:', error); 
          this.loading = false;
          this.errorMessage = error || 'Failed to update user. Please try again.';
        }
      });
    } else {
      // Add new user
      this.userService.addUser(formData).subscribe({
        next: (response) => {
          this.loading = false;
          this.successMessage = 'User added successfully!';
          this.userForm.reset();
          this.initializeForm();
          setTimeout(() => {
            this.router.navigate(['/users-list']);
          }, 1500);
        },
        error: (error) => {
          // console.error('Error adding user:', error);
          this.loading = false;
          this.errorMessage = error || 'Failed to add user. Please try again.';
        }
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  togglePassword(input: HTMLInputElement, event: any) {
    if (input.type === 'password') {
      input.type = 'text';
      event.target.classList.remove('ri-eye-line');
      event.target.classList.add('ri-eye-off-line');
    } else {
      input.type = 'password';
      event.target.classList.remove('ri-eye-off-line');
      event.target.classList.add('ri-eye-line');
    }
  }
}