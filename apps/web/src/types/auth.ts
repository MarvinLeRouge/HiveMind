/** Authenticated user returned by the API. */
export interface User {
  id: string;
  username: string;
  email: string;
  isAdmin: boolean;
  createdAt: string;
}

/** Response shape for login and register endpoints. */
export interface AuthResponse {
  accessToken: string;
  user: User;
}
