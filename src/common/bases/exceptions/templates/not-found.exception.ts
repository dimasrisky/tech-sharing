import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionResponse } from '../../base.response';

export class NotFoundException extends HttpException {
  constructor(detail: string, attr: string) {
    const errorFormat = new BaseExceptionResponse(
      'notFound',
      detail ? detail : 'Resource not found.',
      attr,
    );

    super(errorFormat, HttpStatus.NOT_FOUND);
  }
}
