import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/shared/interceptors/response-envelope.interceptor';

describe('Contract regression (old API -> new API)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
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

  beforeEach(async () => {
    await prisma.feedbackModerationLog.deleteMany();
    await prisma.feedbackLike.deleteMany();
    await prisma.feedbackComment.deleteMany();
    await prisma.testHistory.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.test.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('should keep auth register/login contract with envelope', async () => {
    const username = `u_${Date.now()}`;
    const password = 'pass1234';

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ username, password })
      .expect(201);

    expect(registerRes.body).toEqual(
      expect.objectContaining({
        code: 0,
        message: 'ok',
        data: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      }),
    );

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ username, password })
      .expect(201);

    expect(loginRes.body.code).toBe(0);
    expect(loginRes.body.data.accessToken).toEqual(expect.any(String));
  });

  it('should keep guard failure behavior for protected routes', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/feedback/comments')
      .send({ body: 'hello' })
      .expect(401);

    expect(res.body).toEqual(
      expect.objectContaining({
        code: 20001,
        message: expect.any(String),
        data: null,
      }),
    );
  });

  it('should keep validation contract for query coercion failures', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/feedback/comments?page=abc')
      .expect(400);

    expect(res.body.code).toBe(10003);
  });

  it('should keep tests list response contract', async () => {
    await prisma.test.create({
      data: {
        testId: 'mbti',
        title: 'MBTI 人格测试',
      },
    });

    const res = await request(app.getHttpServer())
      .get('/api/v1/tests')
      .expect(200);

    expect(res.body).toEqual(
      expect.objectContaining({
        code: 0,
        message: 'ok',
        data: expect.objectContaining({
          tests: expect.any(Array),
        }),
      }),
    );
  });
});
