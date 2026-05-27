import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET /api/admin/businesses - Get all businesses (admin only)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Brak dostępu — wymagane uprawnienia administratora' }, { status: 403 });
    }

    // Fetch all businesses with user info and customer counts
    const allBusinesses = await db.business.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        customers: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform data to match expected format
    const transformedBusinesses = allBusinesses.map(business => ({
      id: business.id,
      name: business.name,
      phone: business.phone,
      googleReviewUrl: business.googleReviewUrl,
      smsProvider: business.smsProvider,
      createdAt: business.createdAt,
      updatedAt: business.updatedAt,
      userId: business.userId,
      userName: business.user.name,
      userEmail: business.user.email,
      customerCount: business.customers.length,
    }));

    return NextResponse.json({ businesses: transformedBusinesses });
  } catch (error) {
    console.error('Error fetching businesses (admin):', error);
    return NextResponse.json({ error: 'Wystąpił błąd serwera' }, { status: 500 });
  }
}
