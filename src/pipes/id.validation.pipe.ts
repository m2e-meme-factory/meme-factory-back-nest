import { ArgumentMetadata, BadRequestException, PipeTransform } from '@nestjs/common';

export class IdValidationPipe implements PipeTransform {
  transform(value: string, meta: ArgumentMetadata) {
    if (meta.type === 'param' && isNaN(Number(value))) {
      throw new BadRequestException('Invalid format: ID should be a number');
    }

    return Number(value);
  }
}
