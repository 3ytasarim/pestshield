import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { ConsumptionLevel } from '../../../common/enums/activity-log.enum';

/**
 * Bu uç sadece 'tech' rolüne açıktır; technicianId body'den alınmaz,
 * her zaman JWT'deki (Supabase) kimlikten (request.user.id) set edilir.
 */
export class CreateActivityLogDto {
  @IsUUID()
  deviceId: string;

  @IsEnum(ConsumptionLevel)
  consumptionLevel: ConsumptionLevel;

  @IsInt()
  @Min(0)
  pestCount: number;

  /** Kontrol sırasında uygulanan işlem, örn: "Yem yenilendi", "Kapan boşaltıldı" */
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  actionTaken: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  pestType?: string;

  /** Belirtilmezse sunucu zamanı (now) kullanılır */
  @IsOptional()
  @IsDateString()
  checkedAt?: string;
}
