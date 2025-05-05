import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // Extract more detailed information from the exception
    let errorMessage: string | string[] = exception.message;
    let errorField: string | null = null;
    let errorCode: string | null = null;

    // Handle structured exception responses
    if (typeof exceptionResponse === 'object') {
      // Extract message
      if ('message' in exceptionResponse) {
        errorMessage = exceptionResponse['message'];
      }
      
      // Extract field information if available
      if ('field' in exceptionResponse) {
        errorField = exceptionResponse['field'];
      }
      
      // Extract error code if available
      if ('errorCode' in exceptionResponse) {
        errorCode = exceptionResponse['errorCode'];
      }
    }

    // Create a standardized error response
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: errorMessage,
      success: false,
      field: errorField,
      errorCode: errorCode,
      // Add request ID for tracking (if you implement request ID middleware)
      requestId: request['id'] || null
    };

    // Add specific error context based on status code
    if (status === HttpStatus.UNAUTHORIZED) {
      errorResponse['authError'] = true;
    } else if (status === HttpStatus.FORBIDDEN) {
      errorResponse['permissionError'] = true;
    } else if (status === HttpStatus.CONFLICT) {
      errorResponse['conflictError'] = true;
    } else if (status === HttpStatus.BAD_REQUEST) {
      errorResponse['validationError'] = true;
    }

    // Log server errors (500s) for monitoring
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error(`[Server Error] ${request.method} ${request.url}:`, exception);
    }

    response.status(status).json(errorResponse);
  }
}