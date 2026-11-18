import type { Role } from "../generated/prisma/client.js";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}