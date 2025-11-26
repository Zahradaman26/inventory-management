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
    // this.errorMessage = '';

    const credentials: LoginCredentials = {
      contactNumber: this.loginForm.value.contactNumber,
      password: this.loginForm.value.password,
    };

    this.authService.loginUser(credentials).subscribe({
      next: (response) => {
        this.loading = false;
        this.router.navigate(['/home-10']);
      },
      error: (errorMsg: string) => {
        this.errorMessage = errorMsg;
        this.loading = false;
      },
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
