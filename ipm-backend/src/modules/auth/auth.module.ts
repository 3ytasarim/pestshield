import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SupabaseAdminService } from './supabase-admin.service';
import { UsersModule } from '../users/users.module';

/**
 * Login/refresh/logout Supabase Auth client SDK üzerinden yapılır; bu
 * modül sadece (1) gelen Supabase access token'ını doğrular (JwtStrategy)
 * ve (2) yeni kullanıcı oluşturmak için Supabase Admin API'sini sarar
 * (SupabaseAdminService) - örn. firma kaydı, çalışan daveti.
 */
@Module({
  imports: [PassportModule, UsersModule],
  providers: [JwtStrategy, SupabaseAdminService],
  exports: [SupabaseAdminService],
})
export class AuthModule {}
