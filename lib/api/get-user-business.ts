import { db } from '@/lib/db';

export async function getUserBusiness(userId: string) {
  return db.business.findFirst({ where: { userId } });
}
