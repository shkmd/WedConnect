import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { PermissionGuard } from './permission.guard';
@Module({ controllers: [AuthController], providers: [AuthService, AuthGuard, PermissionGuard], exports: [AuthService, AuthGuard, PermissionGuard] })
export class AuthModule {}
