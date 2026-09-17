import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionResponse } from '../../base.response';

export class ForbiddenException extends HttpException {
  constructor(detail?: string) {
    const errorFormat = new BaseExceptionResponse(
      'permissionDenied',
      detail ? detail : "You don't have permission to access this resource.",
    );
    super(errorFormat, HttpStatus.FORBIDDEN);
  }
}
