export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export const sendSuccess = <T>(message: string, data?: T): ApiResponse<T> => {
  return {
    success: true,
    message,
    data,
  };
};

export const sendError = (message: string, error?: any): ApiResponse => {
  return {
    success: false,
    message,
    error,
  };
};
