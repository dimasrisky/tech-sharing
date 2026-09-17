import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionResponse } from '../../base.response';

export class UnauthorizedException extends HttpException {
  constructor(code?: string, detail?: string) {
    const errorFormat = new BaseExceptionResponse(
      code ? code : 'notAuthenticated',
      detail ? detail : 'Authentication credentials not provided.',
    );
    super(errorFormat, HttpStatus.UNAUTHORIZED);
  }
}
