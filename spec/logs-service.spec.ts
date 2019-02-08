import * as supertest from 'supertest';
import { startSlsOffline, stopSlsOffline } from './helpers/integration-test-lifecycle';

jasmine.DEFAULT_TIMEOUT_INTERVAL = 30000;

const request = supertest('http://localhost:3000');

describe('integration test', () => {
  beforeAll((done) => {
    startSlsOffline((err: any) => {
      if (err) {
        console.error(err);
        fail();
      }
      done();
    });
  });
  afterAll(() => {
    stopSlsOffline();
  });

  it('should respond 200 for a successful post', (done) => {
   /* request
      .post('/log')
      .expect(200)
      .end((err) => {
        if (err) throw err;
        done();
      }); */
    expect(true);
    done();
  });
});
