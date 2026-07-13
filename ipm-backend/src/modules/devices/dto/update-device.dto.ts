import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateDeviceDto } from './create-device.dto';

/** Cihazı başka bir firmaya taşımak desteklenmez; companyId sabittir. */
export class UpdateDeviceDto extends PartialType(
  OmitType(CreateDeviceDto, ['companyId'] as const),
) {}
