import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine the HTTP status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get the error message
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'object' && 'message' in exceptionResponse 
        ? String(exceptionResponse.message) 
        : String(exception);
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Log the error for server-side debugging
    console.error(`[Exception] ${request.method} ${request.url}:`, exception);

    // Create a standardized error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: status === HttpStatus.INTERNAL_SERVER_ERROR 
        ? 'An error occurred on the server. Please try again later.' // Hide actual error in production
        : message,
      success: false,
      requestId: request['id'] || null
    };

    response.status(status).json(errorResponse);
  }
}