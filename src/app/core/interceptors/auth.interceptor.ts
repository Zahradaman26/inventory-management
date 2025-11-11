import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const JwtInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Get token from localStorage
  const token = localStorage.getItem('authToken');
  console.log('Interceptor - Token exists:', !!token);
  console.log('Interceptor - Request URL:', req.url);
  
  // Clone the request and add authorization header if token exists
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Interceptor - Added Authorization header');
  } else {
    console.log('Interceptor - No token found');
  }

  // Handle the request and catch errors
  return next(authReq).pipe(
    catchError((error) => {
      console.log('Interceptor - HTTP Error:', error.status);
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        console.log('Interceptor - 401 Unauthorized, redirecting to login');
        // Clear stored token and redirect to login
        localStorage.removeItem('authToken');
        router.navigate(['sign-in']);
      }
      
      // Re-throw the error
      return throwError(() => error);
    })
  );
};