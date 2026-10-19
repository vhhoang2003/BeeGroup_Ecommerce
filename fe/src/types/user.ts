export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone?: string;
  avatar?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: User;
}
