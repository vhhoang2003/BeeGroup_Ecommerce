// README §10 / §15: catalog endpoints at 50 virtual users, p95 < 300 ms.
//
//   docker run --rm -i -e BASE_URL=https://beestore.vn/api/v1 grafana/k6:2.3.0 run - < infra/loadtest/catalog.js
//
// Point BASE_URL at staging or at the API directly. The global rate limit (300 requests / min / IP, SEC-08) answers
// 429 long before 50 users from one machine, so run it against an API started with BEESTORE_RATELIMIT_ENABLED=false.
// Last local run (2026-10-20, Docker Desktop, 20 products): p95 = 59 ms, 0 % errors.
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:8080/api/v1';
const LOCALES = ['vi', 'en', 'zh'];
const QUERIES = ['7B13', 'SP3', 'EPYC', 'tesla', '64'];

export const options = {
  stages: [
    { duration: __ENV.RAMP || '30s', target: 50 },
    { duration: __ENV.HOLD || '1m', target: 50 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.01'],
  },
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function setup() {
  const res = http.get(`${BASE}/products?size=48`);
  const slugs = res.json('data.content').map((p) => p.slug);
  if (slugs.length === 0) throw new Error('No products; import the catalog first');
  return { slugs };
}

export default function ({ slugs }) {
  const locale = pick(LOCALES);
  const slug = pick(slugs);
  const responses = http.batch([
    ['GET', `${BASE}/categories?locale=${locale}`],
    ['GET', `${BASE}/products?category=cpu&page=0&size=12&locale=${locale}`],
    ['GET', `${BASE}/products/${slug}?locale=${locale}`],
    ['GET', `${BASE}/products/${slug}/related?locale=${locale}`],
    ['GET', `${BASE}/products/suggestions?q=${pick(QUERIES)}&locale=${locale}`],
  ]);
  for (const res of responses) check(res, { 'status 200': (r) => r.status === 200 });
  sleep(1);
}
