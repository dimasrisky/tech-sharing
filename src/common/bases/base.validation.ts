import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
  Type,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { BaseExceptionResponse } from './base.response';

@Injectable()
export class BaseValidationPipe implements PipeTransform {
  async transform(
    value: unknown,
    { metatype }: ArgumentMetadata,
  ): Promise<unknown> {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance<object, unknown>(metatype, value) as Record<
      string,
      unknown
    >;
    const errors: ValidationError[] = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException(this.formatErrors(errors));
    }

    return object;
  }

  private toValidate(metatype: Type<unknown>): boolean {
    const types: Type<unknown>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: ValidationError[]): BaseExceptionResponse[] {
    return errors.map((err) => {
      if (!err.constraints)
        return new BaseExceptionResponse(
          'unknown_error',
          'Unknown validation error',
          err.property,
        );

      const [code, detail] = Object.entries(err.constraints)[0];
      return new BaseExceptionResponse(code, detail, err.property);
    });
  }
}
