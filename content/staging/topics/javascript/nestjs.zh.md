---
title: NestJS 完全指南
description: 掌握NestJS企业级Node.js框架，构建可扩展的服务端应用
track: javascript
section: node
difficulty: intermediate
tags:
  - NestJS
  - Node.js
  - TypeScript
  - 企业级
status: imported
origin: old/src/content/docs/backend/nestjs.zh.md
divergence: 0.234
issues: []
legacy:
  category: Backend
  subcategory: Node.js
  order: 5
  lastUpdated: 2026-01-07
---

## 概念解释：NestJS 是什么

NestJS 是一个用于构建高效、可扩展的 Node.js 服务器端应用程序的框架。它使用 TypeScript 构建（同时也支持纯 JavaScript），结合了面向对象编程（OOP）、函数式编程（FP）和函数式响应式编程（FRP）的元素。

### 为什么选择 NestJS

与 Express.js 的极简主义不同，NestJS 采用了"约定优于配置"的设计理念，提供了一个开箱即用的应用程序架构。这种架构深受 Angular 的启发，使得创建高度可测试、可扩展、松散耦合且易于维护的应用程序成为可能。

NestJS 的核心优势包括：

- **模块化架构**：通过模块组织代码，实现关注点分离
- **依赖注入**：内置强大的 IoC 容器，简化依赖管理
- **TypeScript 原生支持**：充分利用类型系统提高代码质量
- **丰富的生态系统**：支持 GraphQL、WebSocket、微服务等多种技术
- **企业级特性**：内置验证、序列化、缓存、定时任务等功能
- **渐进式框架**：可以逐步引入功能，也可以使用 Express 或 Fastify 作为底层

```
NestJS 适用场景：
1. 企业级 RESTful API 服务
2. GraphQL 服务端应用
3. 微服务架构
4. 实时应用（WebSocket）
5. 全栈应用（配合前端框架）
```

## NestJS 架构与设计理念

### 架构概览

NestJS 的架构基于模块化设计，核心概念包括模块（Module）、控制器（Controller）、提供者（Provider）和中间件（Middleware）等。

```
┌─────────────────────────────────────────────────────────────┐
│                        NestJS 应用                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │                    根模块 (AppModule)                 │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │    │
│  │  │ UserModule  │  │ AuthModule  │  │ OrderModule │  │    │
│  │  │ Controller  │  │ Controller  │  │ Controller  │  │    │
│  │  │  Service    │  │  Service    │  │  Service    │  │    │
│  │  │  Repository │  │   Guard     │  │  Repository │  │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│     中间件层 │ 守卫层 │ 拦截器层 │ 管道层 │ 异常过滤器        │
├─────────────────────────────────────────────────────────────┤
│              底层 HTTP 平台（Express / Fastify）              │
└─────────────────────────────────────────────────────────────┘
```

### 设计原则

NestJS 遵循以下核心设计原则：

1. **单一职责原则（SRP）**：每个类只负责一项功能
2. **依赖反转原则（DIP）**：高层模块不依赖低层模块，而是依赖抽象
3. **开闭原则（OCP）**：对扩展开放，对修改关闭
4. **接口隔离原则（ISP）**：使用多个专门的接口，而不是单一的总接口

## 模块、控制器、服务

### 模块（Module）

模块是 NestJS 组织应用程序结构的基本单元。每个应用至少有一个根模块（通常是 AppModule），用于构建应用程序的依赖图。

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // 导入其他模块
  ],
  controllers: [UserController],        // 注册控制器
  providers: [UserService],             // 注册提供者
  exports: [UserService],               // 导出供其他模块使用
})
export class UserModule {}
```

模块的核心属性：

- `imports`：导入的模块列表，这些模块导出的提供者在本模块中可用
- `controllers`：本模块中定义的控制器集合
- `providers`：由 Nest 注入器实例化的提供者，可在本模块中共享
- `exports`：本模块提供的提供者子集，可被其他模块使用

### 控制器（Controller）

控制器负责处理传入的请求和向客户端返回响应。控制器的目的是接收应用程序的特定请求，路由机制控制哪个控制器接收哪些请求。

```typescript
// user.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from './dto/pagination.dto';

@Controller('users')  // 路由前缀
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users
  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    return this.userService.findAll(paginationDto);
  }

  // GET /users/:id
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  // POST /users
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // PUT /users/:id
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  // DELETE /users/:id
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
```

### 服务（Service）

服务是提供者的一种，主要用于处理业务逻辑。服务可以被注入到控制器或其他服务中。

```typescript
// user.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto } from './dto/pagination.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`用户 #${id} 不存在`);
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
```

## 依赖注入与 IoC 容器

### 依赖注入原理

依赖注入（Dependency Injection，DI）是一种设计模式，它将对象的创建和依赖关系的管理从对象内部转移到外部容器。NestJS 的 IoC（控制反转）容器负责管理所有提供者的生命周期和依赖关系。

```typescript
// 传统方式：紧耦合
class UserController {
  private userService: UserService;

  constructor() {
    // 控制器直接创建服务实例，紧耦合
    this.userService = new UserService(new UserRepository());
  }
}

// NestJS 方式：依赖注入
@Controller('users')
class UserController {
  // NestJS 容器自动注入依赖
  constructor(private readonly userService: UserService) {}
}
```

### 提供者作用域

NestJS 支持三种提供者作用域：

```typescript
import { Injectable, Scope } from '@nestjs/common';

// 1. 单例作用域（默认）- 整个应用共享一个实例
@Injectable()
export class SingletonService {}

// 2. 请求作用域 - 每个请求创建新实例
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(@Inject(REQUEST) private request: Request) {}
}

// 3. 瞬态作用域 - 每次注入创建新实例
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {}
```

### 自定义提供者

NestJS 支持多种自定义提供者的方式：

```typescript
// module.ts
@Module({
  providers: [
    // 1. 标准提供者
    UserService,

    // 2. 值提供者
    {
      provide: 'CONFIG',
      useValue: {
        apiUrl: 'https://api.example.com',
        timeout: 5000,
      },
    },

    // 3. 类提供者
    {
      provide: 'LOGGER',
      useClass: process.env.NODE_ENV === 'production'
        ? ProductionLogger
        : DevelopmentLogger,
    },

    // 4. 工厂提供者
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const options = configService.get('database');
        return createConnection(options);
      },
      inject: [ConfigService],
    },

    // 5. 别名提供者
    {
      provide: 'AliasedService',
      useExisting: UserService,
    },
  ],
})
export class AppModule {}

// 使用自定义提供者
@Injectable()
export class SomeService {
  constructor(
    @Inject('CONFIG') private config: any,
    @Inject('LOGGER') private logger: Logger,
  ) {}
}
```

## 中间件、守卫、拦截器、管道

### 请求生命周期

NestJS 请求的完整生命周期如下：

```
传入请求
    │
    ▼
中间件（Middleware）
    │
    ▼
守卫（Guards）
    │
    ▼
拦截器（前置）
    │
    ▼
管道（Pipes）
    │
    ▼
路由处理程序
    │
    ▼
拦截器（后置）
    │
    ▼
异常过滤器（如果抛出异常）
    │
    ▼
服务器响应
```

### 中间件（Middleware）

中间件是在路由处理程序之前调用的函数，可以访问请求和响应对象。

```typescript
// logger.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = Date.now() - startTime;
      console.log(`${method} ${originalUrl} ${statusCode} - ${duration}ms`);
    });

    next();
  }
}

// 函数式中间件
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
}

// app.module.ts - 注册中间件
@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware, corsMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
```

### 守卫（Guards）

守卫用于确定请求是否应该被处理，主要用于身份验证和授权。

```typescript
// auth.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('未提供认证令牌');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch {
      throw new UnauthorizedException('无效的认证令牌');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// roles.guard.ts - 基于角色的守卫
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// 使用守卫
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {}
```

### 拦截器（Interceptors）

拦截器可以在方法执行之前和之后添加额外的逻辑，用于日志记录、缓存、响应转换等。

```typescript
// transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  code: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => ({
        code: 0,
        message: 'success',
        data,
      })),
    );
  }
}

// logging.interceptor.ts
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        this.logger.log(`${method} ${url} - ${Date.now() - now}ms`);
      }),
    );
  }
}

// cache.interceptor.ts
@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private cache = new Map<string, any>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const key = request.url;

    if (this.cache.has(key)) {
      return of(this.cache.get(key));
    }

    return next.handle().pipe(
      tap((response) => {
        this.cache.set(key, response);
        // 5 分钟后清除缓存
        setTimeout(() => this.cache.delete(key), 5 * 60 * 1000);
      }),
    );
  }
}
```

### 管道（Pipes）

管道用于数据转换和验证。NestJS 内置了多个管道，也支持自定义管道。

```typescript
// validation.pipe.ts
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors.map((err) =>
        Object.values(err.constraints || {}).join(', '),
      );
      throw new BadRequestException(messages);
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}

// create-user.dto.ts
import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString({ message: '用户名必须是字符串' })
  @MinLength(2, { message: '用户名至少需要2个字符' })
  @Transform(({ value }) => value?.trim())
  username: string;

  @IsEmail({}, { message: '请提供有效的邮箱地址' })
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  password: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
```

## 数据库集成

### TypeORM 集成

TypeORM 是一个功能丰富的 ORM 框架，NestJS 提供了 `@nestjs/typeorm` 包进行集成。

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV === 'development',
    }),
  ],
})
export class AppModule {}

// user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  BeforeInsert,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Order } from '../order/order.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}

// 高级查询示例
@Injectable()
export class UserService {
  async findUsersWithOrders(filters: UserFiltersDto) {
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.orders', 'order')
      .where('user.isActive = :isActive', { isActive: true });

    if (filters.username) {
      queryBuilder.andWhere('user.username LIKE :username', {
        username: `%${filters.username}%`,
      });
    }

    if (filters.startDate && filters.endDate) {
      queryBuilder.andWhere('user.createdAt BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    }

    return queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip(filters.offset)
      .take(filters.limit)
      .getManyAndCount();
  }
}
```

### Prisma 集成

Prisma 是一个现代化的数据库工具包，提供了类型安全的数据库访问。

```typescript
// prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // 软删除扩展
  async softDelete(model: string, id: number) {
    return this[model].update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

// prisma/schema.prisma
/*
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  username  String   @unique
  password  String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  Int
  createdAt DateTime @default(now())
}
*/

// user.service.ts
@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      where,
      orderBy,
      include: {
        posts: {
          where: { published: true },
          take: 5,
        },
      },
    });
  }

  async createWithPosts(data: CreateUserWithPostsDto) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
        posts: {
          create: data.posts,
        },
      },
      include: { posts: true },
    });
  }
}
```

## 认证与授权

### JWT 认证实现

```typescript
// auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET,
        signOptions: {
          expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}

// auth.service.ts
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, roles: user.roles };

    return {
      user,
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userService.findOne(payload.sub);

      return {
        accessToken: this.jwtService.sign({
          sub: user.id,
          email: user.email,
          roles: user.roles,
        }),
      };
    } catch (error) {
      throw new UnauthorizedException('刷新令牌无效');
    }
  }
}

// jwt.strategy.ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
  }
}

// auth.controller.ts
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req) {
    return req.user;
  }
}
```

### 基于角色的访问控制（RBAC）

```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// permissions.decorator.ts
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// 使用装饰器
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('users')
  @Roles('admin', 'super-admin')
  findAllUsers() {
    return this.userService.findAll();
  }

  @Delete('users/:id')
  @Roles('super-admin')
  @Permissions('user:delete')
  removeUser(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
```

## WebSocket 支持

NestJS 提供了对 WebSocket 的原生支持，可以轻松创建实时应用。

```typescript
// chat.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsAuthGuard } from './guards/ws-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    this.connectedUsers.set(client.id, userId);
    console.log(`用户 ${userId} 已连接`);

    // 广播用户上线
    this.server.emit('userOnline', { userId });
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    this.connectedUsers.delete(client.id);
    console.log(`用户 ${userId} 已断开`);

    // 广播用户下线
    this.server.emit('userOffline', { userId });
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(data.roomId);
    return { event: 'joinedRoom', data: { roomId: data.roomId } };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { roomId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(data.roomId);
    return { event: 'leftRoom', data: { roomId: data.roomId } };
  }

  @UseGuards(WsAuthGuard)
  @SubscribeMessage('sendMessage')
  handleMessage(
    @MessageBody() data: { roomId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    const message = {
      id: Date.now().toString(),
      userId,
      content: data.content,
      timestamp: new Date(),
    };

    // 向房间内所有用户广播消息
    this.server.to(data.roomId).emit('newMessage', message);

    return { event: 'messageSent', data: message };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: { roomId: string; isTyping: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = this.connectedUsers.get(client.id);
    client.to(data.roomId).emit('userTyping', { userId, isTyping: data.isTyping });
  }
}
```

## 微服务架构

NestJS 提供了强大的微服务支持，支持多种传输层协议。

### 创建微服务

```typescript
// main.ts - 微服务入口
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // 创建微服务
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: '127.0.0.1',
        port: 3001,
      },
    },
  );

  await app.listen();
}
bootstrap();

// 混合应用 - 同时支持 HTTP 和微服务
async function bootstrapHybrid() {
  const app = await NestFactory.create(AppModule);

  // 连接微服务
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.REDIS,
    options: {
      host: 'localhost',
      port: 6379,
    },
  });

  await app.startAllMicroservices();
  await app.listen(3000);
}
```

### 消息模式

```typescript
// user.controller.ts - 微服务控制器
import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class UserController {
  // 请求-响应模式
  @MessagePattern({ cmd: 'get_user' })
  async getUser(@Payload() data: { id: number }) {
    return this.userService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'create_user' })
  async createUser(@Payload() data: CreateUserDto) {
    return this.userService.create(data);
  }

  // 事件模式（单向）
  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: any) {
    // 处理用户创建事件，例如发送欢迎邮件
    await this.emailService.sendWelcomeEmail(data.email);
  }

  @EventPattern('order_completed')
  async handleOrderCompleted(@Payload() data: any) {
    // 更新用户积分
    await this.userService.addPoints(data.userId, data.points);
  }
}

// 客户端调用
@Injectable()
export class OrderService {
  constructor(
    @Inject('USER_SERVICE') private userClient: ClientProxy,
  ) {}

  async createOrder(orderDto: CreateOrderDto) {
    // 同步调用 - 请求响应
    const user = await firstValueFrom(
      this.userClient.send({ cmd: 'get_user' }, { id: orderDto.userId }),
    );

    // 创建订单逻辑...

    // 异步发送事件
    this.userClient.emit('order_completed', {
      userId: orderDto.userId,
      orderId: order.id,
      points: order.total * 10,
    });

    return order;
  }
}
```

### 使用 RabbitMQ

```typescript
// app.module.ts
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_SERVICE',
        transport: Transport.RMQ,
        options: {
          urls: ['amqp://localhost:5672'],
          queue: 'main_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
})
export class AppModule {}
```

## 测试策略

### 单元测试

```typescript
// user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

describe('UserService', () => {
  let service: UserService;
  let mockRepository: any;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    isActive: true,
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('findOne', () => {
    it('应该返回指定ID的用户', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('当用户不存在时应该抛出 NotFoundException', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(
        '用户 #999 不存在',
      );
    });
  });

  describe('create', () => {
    it('应该创建并返回新用户', async () => {
      const createUserDto = {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
      };

      mockRepository.create.mockReturnValue(mockUser);
      mockRepository.save.mockResolvedValue(mockUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockUser);
      expect(mockRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(mockRepository.save).toHaveBeenCalled();
    });
  });
});
```

### 端到端测试（E2E）

```typescript
// test/app.e2e-spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // 获取认证令牌
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('应该返回用户列表', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toBeDefined();
        });
    });

    it('未认证时应该返回 401', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('/users (POST)', () => {
    it('应该创建新用户', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.username).toBe('newuser');
        });
    });

    it('验证失败时应该返回 400', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'a', // 太短
          email: 'invalid-email',
        })
        .expect(400);
    });
  });
});
```

## 面试要点

### 核心概念理解

**1. NestJS 与 Express 的区别是什么？**

```
NestJS 与 Express 的主要区别：

架构层面：
- Express：极简主义，无固定结构，需要自行组织代码
- NestJS：提供完整的模块化架构，约定优于配置

依赖管理：
- Express：手动管理依赖关系
- NestJS：内置 IoC 容器，自动依赖注入

语言支持：
- Express：原生 JavaScript，TypeScript 需额外配置
- NestJS：原生 TypeScript 支持，充分利用类型系统

功能完整性：
- Express：核心功能精简，需要大量第三方中间件
- NestJS：开箱即用的企业级功能（验证、序列化、缓存等）

适用场景：
- Express：小型项目、原型开发、需要高度灵活性的场景
- NestJS：大型企业应用、需要严格架构规范的团队项目
```

**2. 解释 NestJS 的依赖注入机制**

```typescript
// NestJS 依赖注入的工作原理：

// 1. 使用 @Injectable() 装饰器标记可注入的类
@Injectable()
export class UserService {
  // 服务逻辑
}

// 2. 在模块中注册提供者
@Module({
  providers: [UserService],
})
export class UserModule {}

// 3. NestJS 在编译时收集元数据
// 4. 运行时 IoC 容器创建并管理实例
// 5. 通过构造函数自动注入依赖

@Controller()
export class UserController {
  // NestJS 自动注入 UserService 实例
  constructor(private readonly userService: UserService) {}
}

// 依赖注入的优势：
// - 松耦合：组件之间不直接创建依赖
// - 可测试性：易于 mock 依赖进行单元测试
// - 可维护性：集中管理依赖关系
// - 灵活性：运行时可替换实现
```

**3. 守卫和中间件的区别？**

```
执行时机：
- 中间件：最先执行，在路由处理之前
- 守卫：在中间件之后、拦截器之前执行

作用范围：
- 中间件：只能访问 req/res 对象
- 守卫：可以访问 ExecutionContext，获取更多上下文信息

主要用途：
- 中间件：日志、CORS、请求解析、通用处理
- 守卫：认证、授权、权限控制

返回值：
- 中间件：调用 next() 继续或结束请求
- 守卫：返回 true/false 决定是否继续处理
```

### 实战问题

**4. 如何实现请求级别的日志追踪？**

```typescript
// 使用 cls-hooked 或 AsyncLocalStorage 实现请求上下文
import { AsyncLocalStorage } from 'async_hooks';

export const requestContext = new AsyncLocalStorage<Map<string, any>>();

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const store = new Map<string, any>();
    store.set('requestId', uuidv4());
    store.set('startTime', Date.now());

    requestContext.run(store, () => {
      next();
    });
  }
}

// 在任何地方获取请求 ID
export function getRequestId(): string {
  return requestContext.getStore()?.get('requestId') || 'unknown';
}
```

**5. 如何处理循环依赖？**

```typescript
// 方法 1：使用 forwardRef
@Injectable()
export class UserService {
  constructor(
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
  ) {}
}

@Injectable()
export class OrderService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}
}

// 方法 2：重新设计架构，提取公共逻辑到新服务
// 方法 3：使用事件驱动解耦
```

### 性能优化

**6. NestJS 应用的性能优化策略**

```typescript
// 1. 使用 Fastify 替代 Express
const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);

// 2. 启用压缩
import compression from 'compression';
app.use(compression());

// 3. 使用缓存
@Injectable()
export class UserService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async findOne(id: number) {
    const cached = await this.cacheManager.get(`user:${id}`);
    if (cached) return cached;

    const user = await this.userRepository.findOne({ where: { id } });
    await this.cacheManager.set(`user:${id}`, user, 3600);
    return user;
  }
}

// 4. 数据库查询优化
// - 使用索引
// - 避免 N+1 问题
// - 使用分页

// 5. 使用队列处理耗时任务
@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendWelcomeEmail(email: string) {
    await this.emailQueue.add('welcome', { email });
  }
}
```

### 最佳实践总结

```
1. 项目结构
   - 按功能模块划分，而非按技术层划分
   - 每个模块包含自己的 controller、service、dto、entity

2. 错误处理
   - 使用内置异常类
   - 实现全局异常过滤器
   - 统一错误响应格式

3. 配置管理
   - 使用 @nestjs/config 管理配置
   - 环境变量验证
   - 敏感配置加密

4. 安全措施
   - 启用 helmet
   - 实现 rate limiting
   - 输入验证和清理
   - CORS 配置

5. 日志和监控
   - 结构化日志
   - 请求追踪
   - 健康检查端点
   - 性能指标收集

6. 测试策略
   - 单元测试覆盖核心业务逻辑
   - 集成测试验证模块交互
   - E2E 测试验证 API 行为
```

## 总结

NestJS 是一个强大的企业级 Node.js 框架，它通过模块化架构、依赖注入和装饰器等特性，为构建可扩展、可维护的服务器端应用提供了完整的解决方案。掌握 NestJS 需要理解其核心概念（模块、控制器、服务）、请求生命周期（中间件、守卫、拦截器、管道）、以及企业级功能（认证授权、微服务、WebSocket）。

在实际项目中，合理运用 NestJS 的特性可以显著提高开发效率和代码质量。同时，理解其底层原理对于解决复杂问题和进行性能优化也至关重要。
