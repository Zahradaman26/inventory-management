export interface User {
    _id: {
      $oid: string;
    };
    username: string;
    email: string;
    password?: string; // Make optional since API might not return it
    role: 'super_admin' | 'admin' | 'user';
    isActive: boolean;
    createdBy?: string | null;
    venue?: string | null;
    createdAt?: string;
    updatedAt?: string;
    __v?: number;
}

export interface LoginCredentials {
  email: string; 
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

// Add API response interfaces
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}