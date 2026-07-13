import { IsEnum } from 'class-validator';
import { ClientCompanyStatus } from '../../../common/enums/client-company.enum';

/** Admin: firmayı askıya alma/yeniden aktive etme (onay POST /companies/:id/approve ile ayrıdır) */
export class UpdateCompanyStatusDto {
  @IsEnum(ClientCompanyStatus)
  status: ClientCompanyStatus;
}
