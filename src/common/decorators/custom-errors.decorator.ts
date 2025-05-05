import { HttpException, HttpStatus } from '@nestjs/common';

export class EmailAlreadyExistsException extends HttpException {
  constructor() {
    super(
      {
        message: 'Email telah digunakan',
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
        message: 'Username telah digunakan',
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
        message: 'Password salah',
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
        message: 'Email tidak ditemukan',
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
        message: 'Password harus minimal 6 karakter',
        field: 'password',
        errorCode: 'WEAK_PASSWORD',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}