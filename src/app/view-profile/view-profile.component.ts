import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../services/user.service';
import { UserItem } from '../interfaces/user.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-view-profile',
  standalone: true,
  imports: [BreadcrumbComponent, CommonModule, ReactiveFormsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './view-profile.component.html',
  styleUrl: './view-profile.component.css'
})
export class ViewProfileComponent implements OnInit {
  title = 'View Profile';
  
  // User data
  currentUser: UserItem | null = null;
  loading = true;
  error: string | null = null;
  successMessage: string | null = null;
  
  // Password visibility
  // showNewPassword: boolean = false;
  // showConfirmPassword: boolean = false;
  
  // Image preview
  // imagePreview: string | ArrayBuffer | null = null;
  // selectedFile: File | null = null;
  
  // Forms
  // profileForm!: FormGroup;
  // passwordForm!: FormGroup;
  
  // Available roles (adjust based on your needs)
  roles: string[] = ['Super_Admin', 'User', 'Viewer'];
  
  private destroy$ = new Subject<void>();

  constructor(
    // private fb: FormBuilder,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.loadCurrentUserProfile();
  }

  // initializeForms(): void {
  //   // Profile form
  //   this.profileForm = this.fb.group({
  //     name: ['', [Validators.required]],
  //     email: ['', [Validators.required, Validators.email]],
  //     contactNumber: ['', [Validators.required]],
  //     role: ['', [Validators.required]]
  //   });

  //   // Password form
  //   this.passwordForm = this.fb.group({
  //     newPassword: ['', [Validators.required, Validators.minLength(6)]],
  //     confirmPassword: ['', [Validators.required]]
  //   }, { validators: this.passwordMatchValidator });
  // }

  // passwordMatchValidator(form: FormGroup) {
  //   const password = form.get('newPassword')?.value;
  //   const confirmPassword = form.get('confirmPassword')?.value;
  //   return password === confirmPassword ? null : { passwordMismatch: true };
  // }

  loadCurrentUserProfile(): void {
    this.loading = true;
    this.error = null;

    // First try to get user from localStorage
    const userData = localStorage.getItem('currentUser');
    if (userData) {
      this.currentUser = JSON.parse(userData);
      
      // If we have user ID, fetch complete profile from API
      if (this.currentUser?._id) {
        this.userService.getUserById(this.currentUser._id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.currentUser = response.data;
              // this.populateProfileForm();
              this.loading = false;
            },
            error: (error) => {
              console.error('Error loading user profile:', error);
              // If API fails, still use localStorage data
              // this.populateProfileForm();
              this.loading = false;
            }
          });
      } else {
        // this.populateProfileForm();
        this.loading = false;
      }
    } else {
      this.error = 'No user found. Please login again.';
      this.loading = false;
    }
  }

  // populateProfileForm(): void {
  //   if (this.currentUser) {
  //     this.profileForm.patchValue({
  //       name: this.currentUser.name || '',
  //       email: this.currentUser.email || '',
  //       contactNumber: this.currentUser.contactNumber || '',
  //       role: this.currentUser.role || 'User'
  //     });

  //     // Set image preview if available
  //     if (this.currentUser.imgSrc) {
  //       this.imagePreview = this.currentUser.imgSrc;
  //     }
  //   }
  // }

  // togglePassword(field: 'new' | 'confirm') {
  //   if (field === 'new') {
  //     this.showNewPassword = !this.showNewPassword;
  //   } else if (field === 'confirm') {
  //     this.showConfirmPassword = !this.showConfirmPassword;
  //   }
  // }

  // onFileSelected(event: Event): void {
  //   const fileInput = event.target as HTMLInputElement;

  //   if (fileInput.files && fileInput.files[0]) {
  //     this.selectedFile = fileInput.files[0];
  //     const reader = new FileReader();

  //     reader.onload = () => {
  //       this.imagePreview = reader.result;
  //     };

  //     reader.readAsDataURL(this.selectedFile);
  //   }
  // }

  // onProfileSubmit(): void {
  //   if (this.profileForm.invalid || !this.currentUser) {
  //     this.profileForm.markAllAsTouched();
  //     return;
  //   }

  //   this.loading = true;
  //   this.error = null;
  //   this.successMessage = null;

  //   const formData = new FormData();
  //   formData.append('name', this.profileForm.get('name')?.value);
  //   formData.append('email', this.profileForm.get('email')?.value);
  //   formData.append('contactNumber', this.profileForm.get('contactNumber')?.value);
  //   formData.append('role', this.profileForm.get('role')?.value);
    
  //   if (this.selectedFile) {
  //     formData.append('profileImage', this.selectedFile);
  //   }

  //   this.userService.updateUser(this.currentUser._id, formData)
  //     .pipe(takeUntil(this.destroy$))
  //     .subscribe({
  //       next: (response) => {
  //         this.currentUser = response.data;
  //         this.successMessage = 'Profile updated successfully!';
  //         this.loading = false;
          
          
  //         localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
          
  //         setTimeout(() => {
  //           this.successMessage = null;
  //         }, 3000);
  //       },
  //       error: (error) => {
  //         this.error = error || 'Failed to update profile. Please try again.';
  //         this.loading = false;
  //       }
  //     });
  // }

  // onPasswordSubmit(): void {
  //   if (this.passwordForm.invalid) {
  //     this.passwordForm.markAllAsTouched();
  //     return;
  //   }

  //   this.loading = true;
  //   this.error = null;
  //   this.successMessage = null;

  //   const passwordData = {
  //     password: this.passwordForm.get('newPassword')?.value
  //   };

  //   setTimeout(() => {
  //     this.successMessage = 'Password changed successfully!';
  //     this.passwordForm.reset();
  //     this.loading = false;
      
  //     setTimeout(() => {
  //       this.successMessage = null;
  //     }, 3000);
  //   }, 1000);
  // }

  // onCancel(): void {
  //   this.populateProfileForm(); 
  //   this.passwordForm.reset();
  // }

  // get profileFormControls() {
  //   return this.profileForm.controls;
  // }

  // get passwordFormControls() {
  //   return this.passwordForm.controls;
  // }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}