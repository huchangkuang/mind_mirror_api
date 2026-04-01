import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { FeedbackController } from '../src/modules/feedback/feedback.controller';
import { FeedbackService } from '../src/modules/feedback/feedback.service';
import { HttpExceptionFilter } from '../src/shared/filters/http-exception.filter';
import { ResponseEnvelopeInterceptor } from '../src/shared/interceptors/response-envelope.interceptor';

describe('Feedback query validation', () => {
  let app: INestApplication;
  const feedbackService = {
    listComments: jest.fn().mockResolvedValue([]),
    createComment: jest.fn(),
    toggleLike: jest.fn(),
    deleteComment: jest.fn(),
  };

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [FeedbackController],
      providers: [{ provide: FeedbackService, useValue: feedbackService }],
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

  afterAll(async () => {
    await app.close();
  });

  it('should transform page and pageSize query as numbers', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/feedback/comments?sort=recent&page=2&pageSize=5')
      .expect(200)
      .expect((res) => {
        expect(res.body.code).toBe(0);
      });

    expect(feedbackService.listComments).toHaveBeenCalledWith(
      null,
      'recent',
      2,
      5,
    );
  });

  it('should reject invalid numeric query', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/feedback/comments?page=abc')
      .expect(400)
      .expect((res) => {
        expect(res.body.code).toBe(10003);
      });
  });
});
