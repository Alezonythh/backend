import { HttpException, HttpStatus } from '@nestjs/common';
export class EmailAlreadyExistsException extends HttpException {
  constructor() {
    super(
      {
        message: 'Email already exists',
        field: 'email',
        errorCode: 'EMAIL_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class UsernameAlreadyExistsException extends HttpException {
  constructor() {
    super(
      {
        message: 'Username already exists',
        field: 'username',
        errorCode: 'USERNAME_EXISTS',
      },
      HttpStatus.CONFLICT,
    );
  }
}

export class InvalidPasswordException extends HttpException {
  constructor() {
    super(
      {
        message: 'Invalid password',
        field: 'password',
        errorCode: 'INVALID_PASSWORD',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class EmailNotFoundException extends HttpException {
  constructor() {
    super(
      {
        message: 'Email not found',
        field: 'email',
        errorCode: 'EMAIL_NOT_FOUND',
      },
      HttpStatus.UNAUTHORIZED,
    );
  }
}

export class WeakPasswordException extends HttpException {
  constructor() {
    super(
      {
        message: 'Password must be at least 6 characters',
        field: 'password',
        errorCode: 'WEAK_PASSWORD',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}