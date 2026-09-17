import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionResponse } from '../../base.response';

export class TooManyRequestException extends HttpException {
  constructor(detail?: string) {
    const errorFormat = new BaseExceptionResponse(
      'throttled',
      detail ? detail : 'Too many requests.',
    );
    super(errorFormat, HttpStatus.TOO_MANY_REQUESTS);
  }
}
