import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionResponse } from '../../base.response';

export class ConflictException extends HttpException {
  constructor(detail: string, attr: string, code: string) {
    const errorFormat = new BaseExceptionResponse(
      code,
      detail ? detail : 'Resource not found.',
      attr,
    );

    super(errorFormat, HttpStatus.CONFLICT);
  }
}
