---
title: NestJS Complete Guide
description: Master NestJS for scalable enterprise Node.js applications
track: javascript
section: node
difficulty: intermediate
tags:
  - NestJS
  - Node.js
  - TypeScript
  - Enterprise
status: imported
origin: old/src/content/docs/backend/nestjs.en.md
divergence: 0.234
issues: []
legacy:
  category: Backend
  subcategory: Node.js
  order: 5
  lastUpdated: 2026-01-07
---

## What is NestJS?

NestJS is a progressive Node.js framework for building efficient, reliable, and scalable server-side applications. Built with TypeScript (while also supporting pure JavaScript), it combines elements of Object-Oriented Programming (OOP), Functional Programming (FP), and Functional Reactive Programming (FRP).

### Why Choose NestJS?

Unlike the minimalist approach of Express.js, NestJS adopts a "convention over configuration" design philosophy, providing an out-of-the-box application architecture. This architecture is heavily inspired by Angular, making it possible to create highly testable, scalable, loosely coupled, and easily maintainable applications.

Key advantages of NestJS include:

- **Modular Architecture**: Organize code through modules, achieving separation of concerns
- **Dependency Injection**: Built-in powerful IoC container that simplifies dependency management
- **Native TypeScript Support**: Fully leverages the type system to improve code quality
- **Rich Ecosystem**: Supports GraphQL, WebSocket, microservices, and various other technologies
- **Enterprise-Grade Features**: Built-in validation, serialization, caching, scheduled tasks, and more
- **Progressive Framework**: Features can be adopted gradually, with Express or Fastify as the underlying platform

```
NestJS Use Cases:
1. Enterprise RESTful API services
2. GraphQL server applications
3. Microservices architecture
4. Real-time applications (WebSocket)
5. Full-stack applications (paired with frontend frameworks)
```

## NestJS Architecture and Design Principles

### Architecture Overview

NestJS architecture is based on modular design. Core concepts include Modules, Controllers, Providers, and Middleware.

```
+-------------------------------------------------------------+
|                       NestJS Application                     |
+-------------------------------------------------------------+
|  +-------------------------------------------------------+  |
|  |                  Root Module (AppModule)               |  |
|  |  +-----------+  +-----------+  +-----------+          |  |
|  |  | UserModule|  | AuthModule|  |OrderModule|          |  |
|  |  | Controller|  | Controller|  | Controller|          |  |
|  |  | Service   |  | Service   |  | Service   |          |  |
|  |  | Repository|  | Guard     |  | Repository|          |  |
|  |  +-----------+  +-----------+  +-----------+          |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
|  Middleware | Guards | Interceptors | Pipes | Exception Filters |
+-------------------------------------------------------------+
|           Underlying HTTP Platform (Express / Fastify)       |
+-------------------------------------------------------------+
```

### Design Principles

NestJS follows these core design principles:

1. **Single Responsibility Principle (SRP)**: Each class is responsible for only one functionality
2. **Dependency Inversion Principle (DIP)**: High-level modules don't depend on low-level modules; both depend on abstractions
3. **Open-Closed Principle (OCP)**: Open for extension, closed for modification
4. **Interface Segregation Principle (ISP)**: Use multiple specialized interfaces rather than a single general interface

## Modules, Controllers, and Services

### Modules

Modules are the basic building blocks for organizing application structure in NestJS. Every application has at least one root module (usually AppModule), which is used to build the application's dependency graph.

```typescript
// user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from './entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),  // Import other modules
  ],
  controllers: [UserController],        // Register controllers
  providers: [UserService],             // Register providers
  exports: [UserService],               // Export for use by other modules
})
export class UserModule {}
```

Core module properties:

- `imports`: List of imported modules whose exported providers are available in this module
- `controllers`: Collection of controllers defined in this module
- `providers`: Providers instantiated by the Nest injector, shareable within this module
- `exports`: Subset of providers from this module that can be used by other modules

### Controllers

Controllers are responsible for handling incoming requests and returning responses to the client. The purpose of a controller is to receive specific requests for the application, with the routing mechanism controlling which controller receives which requests.

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

@Controller('users')  // Route prefix
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

### Services

Services are a type of provider primarily used for handling business logic. Services can be injected into controllers or other services.

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
      throw new NotFoundException(`User #${id} not found`);
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

## Dependency Injection and IoC Container

### How Dependency Injection Works

Dependency Injection (DI) is a design pattern that transfers the creation of objects and management of dependencies from inside the object to an external container. NestJS's IoC (Inversion of Control) container is responsible for managing the lifecycle and dependencies of all providers.

```typescript
// Traditional approach: Tight coupling
class UserController {
  private userService: UserService;

  constructor() {
    // Controller directly creates service instance - tight coupling
    this.userService = new UserService(new UserRepository());
  }
}

// NestJS approach: Dependency Injection
@Controller('users')
class UserController {
  // NestJS container automatically injects the dependency
  constructor(private readonly userService: UserService) {}
}
```

### Provider Scopes

NestJS supports three provider scopes:

```typescript
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';

// 1. Singleton scope (default) - Single instance shared across the entire application
@Injectable()
export class SingletonService {}

// 2. Request scope - New instance created for each request
@Injectable({ scope: Scope.REQUEST })
export class RequestScopedService {
  constructor(@Inject(REQUEST) private request: Request) {}
}

// 3. Transient scope - New instance created for each injection
@Injectable({ scope: Scope.TRANSIENT })
export class TransientService {}
```

### Custom Providers

NestJS supports multiple ways to create custom providers:

```typescript
// module.ts
@Module({
  providers: [
    // 1. Standard provider
    UserService,

    // 2. Value provider
    {
      provide: 'CONFIG',
      useValue: {
        apiUrl: 'https://api.example.com',
        timeout: 5000,
      },
    },

    // 3. Class provider
    {
      provide: 'LOGGER',
      useClass: process.env.NODE_ENV === 'production'
        ? ProductionLogger
        : DevelopmentLogger,
    },

    // 4. Factory provider
    {
      provide: 'DATABASE_CONNECTION',
      useFactory: async (configService: ConfigService) => {
        const options = configService.get('database');
        return createConnection(options);
      },
      inject: [ConfigService],
    },

    // 5. Alias provider
    {
      provide: 'AliasedService',
      useExisting: UserService,
    },
  ],
})
export class AppModule {}

// Using custom providers
@Injectable()
export class SomeService {
  constructor(
    @Inject('CONFIG') private config: any,
    @Inject('LOGGER') private logger: Logger,
  ) {}
}
```

## Middleware, Guards, Interceptors, and Pipes

### Request Lifecycle

The complete lifecycle of a NestJS request is as follows:

```
Incoming Request
       |
       v
Middleware
       |
       v
Guards
       |
       v
Interceptors (pre-processing)
       |
       v
Pipes
       |
       v
Route Handler
       |
       v
Interceptors (post-processing)
       |
       v
Exception Filters (if exception thrown)
       |
       v
Server Response
```

### Middleware

Middleware are functions called before the route handler. They have access to the request and response objects.

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

// Functional middleware
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  next();
}

// app.module.ts - Register middleware
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

### Guards

Guards determine whether a request should be processed, primarily used for authentication and authorization.

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
      throw new UnauthorizedException('Authentication token not provided');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}

// roles.guard.ts - Role-based guard
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

// Using guards
@Controller('admin')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {}
```

### Interceptors

Interceptors add extra logic before and after method execution, used for logging, caching, response transformation, and more.

```typescript
// transform.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

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
import { Logger } from '@nestjs/common';

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
import { of } from 'rxjs';

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
        // Clear cache after 5 minutes
        setTimeout(() => this.cache.delete(key), 5 * 60 * 1000);
      }),
    );
  }
}
```

### Pipes

Pipes are used for data transformation and validation. NestJS includes several built-in pipes and also supports custom pipes.

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
  @IsString({ message: 'Username must be a string' })
  @MinLength(2, { message: 'Username must be at least 2 characters' })
  @Transform(({ value }) => value?.trim())
  username: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}
```

## Database Integration

### TypeORM Integration

TypeORM is a feature-rich ORM framework. NestJS provides the `@nestjs/typeorm` package for integration.

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

// Advanced query example
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

### Prisma Integration

Prisma is a modern database toolkit that provides type-safe database access.

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

  // Soft delete extension
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

// user.service.ts with Prisma
import { Prisma } from '@prisma/client';

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

## Authentication and Authorization

### JWT Authentication Implementation

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
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

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
      throw new UnauthorizedException('Invalid refresh token');
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
import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';

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

### Role-Based Access Control (RBAC)

```typescript
// roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

// permissions.decorator.ts
export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Using decorators
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

## WebSocket Support

NestJS provides native support for WebSocket, making it easy to create real-time applications.

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
    console.log(`User ${userId} connected`);

    // Broadcast user online
    this.server.emit('userOnline', { userId });
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    this.connectedUsers.delete(client.id);
    console.log(`User ${userId} disconnected`);

    // Broadcast user offline
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

    // Broadcast message to all users in the room
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

## Microservices Architecture

NestJS provides powerful microservices support with multiple transport layer protocols.

### Creating a Microservice

```typescript
// main.ts - Microservice entry point
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  // Create microservice
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

// Hybrid application - Supporting both HTTP and microservices
async function bootstrapHybrid() {
  const app = await NestFactory.create(AppModule);

  // Connect microservice
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

### Message Patterns

```typescript
// user.controller.ts - Microservice controller
import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';

@Controller()
export class UserController {
  // Request-response pattern
  @MessagePattern({ cmd: 'get_user' })
  async getUser(@Payload() data: { id: number }) {
    return this.userService.findOne(data.id);
  }

  @MessagePattern({ cmd: 'create_user' })
  async createUser(@Payload() data: CreateUserDto) {
    return this.userService.create(data);
  }

  // Event pattern (one-way)
  @EventPattern('user_created')
  async handleUserCreated(@Payload() data: any) {
    // Handle user creation event, e.g., send welcome email
    await this.emailService.sendWelcomeEmail(data.email);
  }

  @EventPattern('order_completed')
  async handleOrderCompleted(@Payload() data: any) {
    // Update user points
    await this.userService.addPoints(data.userId, data.points);
  }
}

// Client invocation
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrderService {
  constructor(
    @Inject('USER_SERVICE') private userClient: ClientProxy,
  ) {}

  async createOrder(orderDto: CreateOrderDto) {
    // Synchronous call - request response
    const user = await firstValueFrom(
      this.userClient.send({ cmd: 'get_user' }, { id: orderDto.userId }),
    );

    // Order creation logic...
    const order = await this.orderRepository.save(orderDto);

    // Asynchronous event emission
    this.userClient.emit('order_completed', {
      userId: orderDto.userId,
      orderId: order.id,
      points: order.total * 10,
    });

    return order;
  }
}
```

### Using RabbitMQ

```typescript
// app.module.ts
import { ClientsModule, Transport } from '@nestjs/microservices';

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

## Testing Strategies

### Unit Testing

```typescript
// user.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

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
    it('should return the user with specified ID', async () => {
      mockRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(mockUser);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create and return a new user', async () => {
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

### End-to-End (E2E) Testing

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

    // Get authentication token
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });

    authToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users (GET)', () => {
    it('should return user list', () => {
      return request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.meta).toBeDefined();
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/users')
        .expect(401);
    });
  });

  describe('/users (POST)', () => {
    it('should create a new user', () => {
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

    it('should return 400 when validation fails', () => {
      return request(app.getHttpServer())
        .post('/users')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          username: 'a', // Too short
          email: 'invalid-email',
        })
        .expect(400);
    });
  });
});
```

## Interview Key Points

### Core Concept Understanding

**1. What is the difference between NestJS and Express?**

```
Main differences between NestJS and Express:

Architecture:
- Express: Minimalist, no fixed structure, requires self-organized code
- NestJS: Provides complete modular architecture, convention over configuration

Dependency Management:
- Express: Manual dependency management
- NestJS: Built-in IoC container with automatic dependency injection

Language Support:
- Express: Native JavaScript, TypeScript requires extra configuration
- NestJS: Native TypeScript support, fully leverages type system

Feature Completeness:
- Express: Minimal core features, requires many third-party middleware
- NestJS: Out-of-the-box enterprise features (validation, serialization, caching, etc.)

Use Cases:
- Express: Small projects, prototyping, scenarios requiring high flexibility
- NestJS: Large enterprise applications, team projects requiring strict architecture standards
```

**2. Explain NestJS's Dependency Injection Mechanism**

```typescript
// How NestJS dependency injection works:

// 1. Use @Injectable() decorator to mark injectable classes
@Injectable()
export class UserService {
  // Service logic
}

// 2. Register providers in module
@Module({
  providers: [UserService],
})
export class UserModule {}

// 3. NestJS collects metadata at compile time
// 4. IoC container creates and manages instances at runtime
// 5. Automatically injects dependencies through constructor

@Controller()
export class UserController {
  // NestJS automatically injects UserService instance
  constructor(private readonly userService: UserService) {}
}

// Benefits of Dependency Injection:
// - Loose coupling: Components don't directly create dependencies
// - Testability: Easy to mock dependencies for unit testing
// - Maintainability: Centralized dependency management
// - Flexibility: Implementations can be swapped at runtime
```

**3. What is the difference between Guards and Middleware?**

```
Execution Timing:
- Middleware: Executes first, before route handling
- Guards: Execute after middleware, before interceptors

Scope of Access:
- Middleware: Can only access req/res objects
- Guards: Can access ExecutionContext with more context information

Primary Purpose:
- Middleware: Logging, CORS, request parsing, general processing
- Guards: Authentication, authorization, permission control

Return Value:
- Middleware: Call next() to continue or end request
- Guards: Return true/false to determine whether to continue processing
```

### Practical Questions

**4. How to implement request-level log tracing?**

```typescript
// Using AsyncLocalStorage to implement request context
import { AsyncLocalStorage } from 'async_hooks';
import { v4 as uuidv4 } from 'uuid';

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

// Get request ID anywhere
export function getRequestId(): string {
  return requestContext.getStore()?.get('requestId') || 'unknown';
}
```

**5. How to handle circular dependencies?**

```typescript
// Method 1: Use forwardRef
import { forwardRef, Inject } from '@nestjs/common';

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

// Method 2: Redesign architecture, extract common logic to new service
// Method 3: Use event-driven decoupling
```

### Performance Optimization

**6. Performance optimization strategies for NestJS applications**

```typescript
// 1. Use Fastify instead of Express
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';

const app = await NestFactory.create<NestFastifyApplication>(
  AppModule,
  new FastifyAdapter(),
);

// 2. Enable compression
import compression from 'compression';
app.use(compression());

// 3. Use caching
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

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

// 4. Database query optimization
// - Use indexes
// - Avoid N+1 problems
// - Use pagination

// 5. Use queues for time-consuming tasks
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EmailService {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async sendWelcomeEmail(email: string) {
    await this.emailQueue.add('welcome', { email });
  }
}
```

### Best Practices Summary

```
1. Project Structure
   - Organize by feature modules, not by technical layers
   - Each module contains its own controller, service, dto, entity

2. Error Handling
   - Use built-in exception classes
   - Implement global exception filters
   - Standardize error response format

3. Configuration Management
   - Use @nestjs/config for configuration management
   - Validate environment variables
   - Encrypt sensitive configurations

4. Security Measures
   - Enable helmet
   - Implement rate limiting
   - Input validation and sanitization
   - CORS configuration

5. Logging and Monitoring
   - Structured logging
   - Request tracing
   - Health check endpoints
   - Performance metrics collection

6. Testing Strategy
   - Unit tests covering core business logic
   - Integration tests verifying module interactions
   - E2E tests validating API behavior
```

## Further Reading

### Official Documentation and Resources

- [NestJS Official Documentation](https://docs.nestjs.com/) - Comprehensive guide to all NestJS features
- [NestJS GitHub Repository](https://github.com/nestjs/nest) - Source code and examples
- [NestJS Discord](https://discord.gg/nestjs) - Community support and discussions

### Recommended Learning Path

1. **Beginners**: Start with the official documentation's "First Steps" and "Controllers" sections
2. **Intermediate**: Deep dive into Providers, Modules, and Middleware
3. **Advanced**: Explore Microservices, GraphQL integration, and custom decorators

### Related Technologies

- **TypeORM Documentation** - For database operations
- **Passport.js** - For authentication strategies
- **Socket.io** - For WebSocket implementations
- **Bull** - For queue management

### Books and Courses

- "NestJS: A Progressive Node.js Framework" - Official documentation guide
- Udemy courses on NestJS enterprise applications
- YouTube tutorials from the NestJS community

## Summary

NestJS is a powerful enterprise-grade Node.js framework that provides a complete solution for building scalable, maintainable server-side applications through modular architecture, dependency injection, and decorators. Mastering NestJS requires understanding its core concepts (Modules, Controllers, Services), request lifecycle (Middleware, Guards, Interceptors, Pipes), and enterprise features (Authentication/Authorization, Microservices, WebSocket).

In real-world projects, properly utilizing NestJS features can significantly boost developer productivity and code quality. Additionally, understanding its underlying principles is crucial for solving complex problems and performing performance optimizations. The framework's strong TypeScript support and Angular-inspired architecture make it an excellent choice for teams building large-scale applications that require consistency, testability, and maintainability.
