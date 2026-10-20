/** Liveness probe for the container health check and uptime monitors (README §16). */
export const dynamic = 'force-dynamic';

export function GET() {
  return Response.json({ status: 'UP' }, { headers: { 'Cache-Control': 'no-store' } });
}
