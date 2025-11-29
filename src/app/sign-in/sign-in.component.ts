import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth-service.service';
import { CommonModule, NgIf } from '@angular/common';
import { LoginCredentials } from '../interfaces/user.model';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule, CommonModule, NgIf],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
})
export class SignInComponent implements OnInit {
  title = 'Sign In';
  loginForm!: FormGroup;
  loading = false;
  showError: boolean = false;
  showSuccess: boolean = false;
  respMessage: string = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      contactNumber: new FormControl('', [Validators.required]),
      password: new FormControl('', [Validators.required]),
    });
  }

  // onSubmit() {
  //   console.log(this.loginForm.value);
  // }

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  get loginFormControl() {
    return this.loginForm.controls;
  }
  get contactNumber() {
    return this.loginForm.get('contactNumber');
  }
  get password() {
    return this.loginForm.get('password');
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;

    const credentials: LoginCredentials = this.loginForm.value;

    this.authService.loginUser(credentials).subscribe({
      next: (res: any) => {
        this.loading = false;

        const isSuccess = res.status === 'success';
        const isAdmin = ['user', 'viewer'].includes(res.user?.role);

        if (!isSuccess) {
          return this.showTempMessage('error');
        }

        // If admin → block login
        if (isAdmin) {
          this.authService.logout();
          this.respMessage = 'Please login to User Portal';
          return this.showTempMessage('error');
        }

        // Normal user
        this.showTempMessage('success');
        this.router.navigate(['/home']);
      },

      error: () => {
        this.loading = false;
        this.showTempMessage('error');
      },
    });
  }

  // Reusable helper (show for 1.5 sec)
  private showTempMessage(type: 'success' | 'error') {
    if (type === 'success') this.showSuccess = true;
    if (type === 'error') this.showError = true;

    setTimeout(() => {
      this.showSuccess = false;
      this.showError = false;
    }, 1500);
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
