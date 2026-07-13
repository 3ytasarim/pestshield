import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface SupabaseJwtPayload {
  sub: string;
  aud: string;
}

/**
 * Supabase Auth (GoTrue) tarafından imzalanan access token'ları doğrular.
 * Backend artık kendi token'ını üretmiyor/imzalamıyor — login/refresh/logout
 * tamamen Supabase Auth'a (client SDK) bırakılmıştır. SUPABASE_JWT_SECRET,
 * Supabase Dashboard > Project Settings > API > JWT Settings altındadır.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('SUPABASE_JWT_SECRET'),
    });
  }

  /**
   * Her istekte kullanıcı profilini public.users'tan taze okur: rol/aktiflik
   * değişimi (örn. işten çıkarılan personel) mevcut access token süresi
   * dolmadan da anında etkili olur.
   */
  async validate(payload: SupabaseJwtPayload): Promise<User> {
    if (payload.aud !== 'authenticated') {
      throw new UnauthorizedException('Geçersiz token');
    }
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Kullanıcı bulunamadı veya pasif');
    }
    return user;
  }
}
