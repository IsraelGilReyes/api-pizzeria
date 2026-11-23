import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import {
  describe,
  it,
  beforeAll,
  afterAll,
  expect,
} from '@jest/globals';
import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    await app.init();
  });

  afterAll(async () => {
  if (app) {
    await app.close();
  }
});

  it('/ (GET) - debe rechazar acceso sin autenticación', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(401);
  });
});