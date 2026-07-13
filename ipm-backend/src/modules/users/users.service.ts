import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { FindUsersQueryDto } from './dto/find-users-query.dto';

/**
 * Kullanıcılar Supabase Auth üzerinden oluşturulur (Admin API + DB
 * trigger'ı otomatik profil satırı açar); bu servis sadece profil
 * okuma/durum yönetimini kapsar.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
  ) {}

  async findAll(query: FindUsersQueryDto): Promise<User[]> {
    return this.usersRepository.find({
      where: query.role ? { role: query.role } : {},
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('Kullanıcı bulunamadı');
    }
    return user;
  }

  async updateStatus(id: string, dto: UpdateUserStatusDto): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = dto.isActive;
    return this.usersRepository.save(user);
  }
}
