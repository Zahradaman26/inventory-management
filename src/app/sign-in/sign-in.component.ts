import { Component, CUSTOM_ELEMENTS_SCHEMA, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth-service.service';
import { CommonModule, NgIf } from '@angular/common';
import { LoginCredentials } from '../interfaces/user.model';

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [ RouterLink, FormsModule, ReactiveFormsModule, CommonModule, NgIf],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css'
})
export class SignInComponent implements OnInit {
  title = 'Sign In';
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.loginForm = this.formBuilder.group({
      email: new FormControl('', [Validators.required]),
      password: new FormControl('',[Validators.required]),
    })  
  }

  // onSubmit() {
  //   console.log(this.loginForm.value);
  // }

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router
  ) { }

  get loginFormControl() {
    return this.loginForm.controls;
  }
  get email() {
    return this.loginForm.get('email');
  }
  get password() {
    return this.loginForm.get('password');
  }

  onLogin(): void{
    if(this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    // if(this.credentials.email && this.credentials.password) {
    //   const fakeToken = 'auth-' + this.credentials.email
    //   this.authService.login(fakeToken)
    // } else {
    //   alert('Please enter both email and password')
    // }
    this.loading = true;
    this.errorMessage = '';

    const credentials: LoginCredentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.loginUser(credentials)
      .subscribe({
        next: (response) => {
          this.loading = false;

          setTimeout(() => {
            this.router.navigate(['/home-10']); // or your products page
          }, 100);
        },
        error: (errorMsg: string) => {
          this.errorMessage = errorMsg;
          this.loading = false;
        }
      });
  }

 }
