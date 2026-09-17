import { HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionResponse } from '../../base.response';

export class UnsupportedMediaTypeException extends HttpException {
  constructor(detail?: string) {
    const errorFormat = new BaseExceptionResponse(
      'notAcceptable',
      detail ? detail : 'Unsupported media type.',
    );
    super(errorFormat, HttpStatus.UNSUPPORTED_MEDIA_TYPE);
  }
}
