import { IsEnum, IsString, IsUUID, MaxLength } from 'class-validator';
import { DeviceType } from '../../../common/enums/device.enum';

export class CreateDeviceDto {
  @IsString()
  @MaxLength(255)
  qrCode: string;

  @IsEnum(DeviceType)
  type: DeviceType;

  @IsString()
  @MaxLength(255)
  locationZone: string;

  @IsUUID()
  companyId: string;
}
