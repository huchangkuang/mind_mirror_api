import {
  Controller,
  Get,
  INestApplication,
  UseGuards,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { JwtAuthGuard } from '../src/modules/auth/jwt-auth.guard';
import { JwtStrategy } from '../src/modules/auth/jwt.strategy';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/shared/interceptors/response-envelope.interceptor';

@Controller({ path: 'protected', version: '1' })
class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtected() {
    return { ok: true };
  }
}

describe('JwtAuthGuard', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PassportModule,
        JwtModule.register({
          secret: 'dev_access_secret',
        }),
      ],
      controllers: [ProtectedController],
      providers: [JwtStrategy],
    }).compile();

    app = moduleRef.createNestApplication();
    jwtService = moduleRef.get(JwtService);
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should reject request without token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/protected')
      .expect(401)
      .expect((res) => {
        expect(res.body.code).toBe(20001);
      });
  });

  it('should reject invalid token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/protected')
      .set('Authorization', 'Bearer invalid.token.value')
      .expect(401)
      .expect((res) => {
        expect(res.body.code).toBe(20001);
      });
  });

  it('should allow valid token', async () => {
    const accessToken = await jwtService.signAsync({
      sub: 1,
      username: 'demo',
    });

    await request(app.getHttpServer())
      .get('/api/v1/protected')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body.code).toBe(0);
      });
  });
});
