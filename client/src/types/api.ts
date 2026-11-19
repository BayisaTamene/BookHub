export interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
}

export interface ApiMessageSuccess {
  success: true;
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
}