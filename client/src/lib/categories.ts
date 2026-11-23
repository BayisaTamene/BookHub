import { api } from "./api";
import type { ApiSuccess } from "../types/api";
import type { Category } from "../types/categories";

export async function getCategories(): Promise<ApiSuccess<Category[]>> {
  return api.get<ApiSuccess<Category[]>>("/categories");
}