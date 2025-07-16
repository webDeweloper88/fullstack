// src/prisma/prisma.module.ts

import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // делает Prisma доступным во всём приложении без импорта в каждый модуль
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
