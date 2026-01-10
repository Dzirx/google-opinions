import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { businesses, users, customers } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// GET /api/admin/businesses - Get all businesses (admin only)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Fetch all businesses with user info and customer counts
    const allBusinesses = await db
      .select({
        id: businesses.id,
        name: businesses.name,
        phone: businesses.phone,
        googleReviewUrl: businesses.googleReviewUrl,
        smsProvider: businesses.smsProvider,
        createdAt: businesses.createdAt,
        updatedAt: businesses.updatedAt,
        userId: businesses.userId,
        userName: users.name,
        userEmail: users.email,
        customerCount: sql<number>`cast(count(${customers.id}) as integer)`,
      })
      .from(businesses)
      .leftJoin(users, eq(businesses.userId, users.id))
      .leftJoin(customers, eq(customers.businessId, businesses.id))
      .groupBy(
        businesses.id,
        businesses.name,
        businesses.phone,
        businesses.googleReviewUrl,
        businesses.smsProvider,
        businesses.createdAt,
        businesses.updatedAt,
        businesses.userId,
        users.name,
        users.email
      )
      .orderBy(businesses.createdAt);

    return NextResponse.json({ businesses: allBusinesses });
  } catch (error) {
    console.error('Error fetching businesses (admin):', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
