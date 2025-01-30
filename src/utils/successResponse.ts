export class SuccessResponse {
    statusCode: number;
    message: string;
    success: boolean;
    data: any;
  
    constructor(data: any, message = 'Your function was performed successfully', success = true, statusCode = 200) {
      this.statusCode = statusCode;
      this.success = success;
      this.data = data;
      this.message = message;
    }
}
