import { IsIn } from 'class-validator';
import { LicenseType } from '../../../common/enums/license.enum';

/** Demo lisans admin onayında otomatik üretilir; burada sadece ücretli tipler seçilebilir. */
export class IssueLicenseDto {
  @IsIn([LicenseType.MONTHLY, LicenseType.YEARLY])
  type: LicenseType.MONTHLY | LicenseType.YEARLY;
}
