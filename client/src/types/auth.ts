import type { ApiSuccess } from "./api";

export type UserRole = "READER" | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthUser extends User {
  createdAt: string;
}

export type AuthResponse = ApiSuccess<AuthUser>;

export type CurrentUserResponse = ApiSuccess<User>;