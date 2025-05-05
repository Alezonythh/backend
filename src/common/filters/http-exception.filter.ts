import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

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
        const message = exceptionResponse['message'];
        errorMessage = Array.isArray(message) 
          ? message 
          : typeof message === 'string' 
            ? message 
            : String(message);
      }
      
      // Extract field information if available
      if ('field' in exceptionResponse) {
        const field = exceptionResponse['field'];
        errorField = field !== null && field !== undefined ? String(field) : null;
      }
      
      // Extract error code if available
      if ('errorCode' in exceptionResponse) {
        const code = exceptionResponse['errorCode'];
        errorCode = code !== null && code !== undefined ? String(code) : null;
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
      this.logger.error(
        `[Server Error] ${request.method} ${request.url}`,
        exception.stack,
        'HttpExceptionFilter'
      );
    } else {
      // Log client errors with less severity
      this.logger.warn(
        `[Client Error ${status}] ${request.method} ${request.url}: ${JSON.stringify(errorMessage)}`,
        'HttpExceptionFilter'
      );
    }

    response.status(status).json(errorResponse);
  }
}