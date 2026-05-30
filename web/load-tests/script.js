import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  scenarios: {
    test: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1s', target: 10 },
        { duration: '3s', target: 50 },
        { duration: '1s', target: 0 },
      ],
    },
  },
};

export default function () {
  const res = http.get('http://localhost:3000');

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
