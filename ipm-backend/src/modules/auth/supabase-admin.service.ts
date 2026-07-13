import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { UserRole } from '../../common/enums/user-role.enum';

export interface CreateSupabaseUserParams {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  companyId?: string;
  isCompanyOwner?: boolean;
}

/**
 * Supabase Auth Admin API'sini (service_role key ile) saran servis.
 * Kullanıcı oluşturmanın TEK yolu budur - role/company_id her zaman
 * app_metadata üzerinden set edilir (kullanıcı tarafından asla
 * değiştirilemez), public.users profili handle_new_auth_user trigger'ı
 * tarafından otomatik açılır.
 */
@Injectable()
export class SupabaseAdminService {
  private readonly client: SupabaseClient;

  constructor(configService: ConfigService) {
    this.client = createClient(
      configService.getOrThrow<string>('SUPABASE_URL'),
      configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { autoRefreshToken: false, persistSession: false } },
    );
  }

  async createUser(params: CreateSupabaseUserParams) {
    const { data, error } = await this.client.auth.admin.createUser({
      email: params.email,
      password: params.password,
      email_confirm: true,
      app_metadata: {
        role: params.role,
        company_id: params.companyId ?? null,
        is_company_owner: params.isCompanyOwner ?? false,
      },
      user_metadata: {
        full_name: params.fullName,
      },
    });

    if (error) {
      throw error;
    }
    return data.user;
  }

  async deleteUser(userId: string): Promise<void> {
    await this.client.auth.admin.deleteUser(userId);
  }
}
