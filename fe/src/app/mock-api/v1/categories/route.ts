import { ok } from '@/lib/catalog/envelope';
import { listCategories } from '@/lib/catalog/source';

export async function GET() {
  return ok(await listCategories());
}
