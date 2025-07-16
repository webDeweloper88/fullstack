import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

export const ROLES_KEY = 'roles'; // bu konstantani dekorator uchun kalit sifatida ishlatamiz

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles); // bu dekoratorni marshrut uchun kerakli rollarni o'rnatish uchun ishlatiladi.
