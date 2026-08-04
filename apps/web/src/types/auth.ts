/** Authenticated user returned by the API. */
export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  language: string;
  createdAt: string;
}

/** Response shape for the login endpoint. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}

/** Response shape for the register endpoint (no token — email verification required). */
export interface RegisterResponse {
  message: string;
  user: User;
}
