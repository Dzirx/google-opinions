import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, visits, businesses } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DashboardContent } from '@/components/dashboard-content';

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const userBusiness = await db.query.businesses.findFirst({
    where: eq(businesses.userId, session.user.id),
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let stats = {
    totalCustomers: 0,
    totalVisits: 0,
    upcomingVisits: 0,
    remindersSent: 0,
    reviewsSent: 0,
    smsPending: 0,
  };

  let recentVisits: any[] = [];

  if (userBusiness) {
    // Get all customers
    const allCustomers = await db.query.customers.findMany({
      where: eq(customers.businessId, userBusiness.id),
      with: {
        visits: {
          orderBy: [desc(visits.createdAt)],
        },
      },
    });

    stats.totalCustomers = allCustomers.length;

    // Flatten all visits
    const allVisits = allCustomers.flatMap(customer =>
      customer.visits.map(visit => ({
        ...visit,
        customerName: `${customer.name} ${customer.surname}`,
        customerPhone: customer.phone,
      }))
    );

    stats.totalVisits = allVisits.length;
    stats.upcomingVisits = allVisits.filter(
      (v) => new Date(v.visitDate) >= today
    ).length;

    // SMS statistics (reminder + review)
    stats.remindersSent = allVisits.filter(v => v.reminderSmsStatus === 'sent').length;
    stats.reviewsSent = allVisits.filter(v => v.reviewSmsStatus === 'sent').length;
    stats.smsPending = allVisits.filter(v =>
      v.reminderSmsStatus === 'pending' || v.reviewSmsStatus === 'pending'
    ).length;

    // Recent 5 visits
    recentVisits = allVisits
      .sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime())
      .slice(0, 5);
  }

  const totalSmsSent = stats.remindersSent + stats.reviewsSent;
  const totalSmsOpportunities = stats.totalVisits * 2; // reminder + review per visit
  const successRate = totalSmsOpportunities > 0
    ? Math.round((totalSmsSent / totalSmsOpportunities) * 100)
    : 0;

  return (
    <DashboardContent
      userName={session.user.name || session.user.email || 'User'}
      stats={{
        totalCustomers: stats.totalCustomers,
        totalVisits: stats.totalVisits,
        totalSmsSent,
        smsPending: stats.smsPending,
        successRate,
        totalSmsOpportunities,
        upcomingVisits: stats.upcomingVisits,
      }}
      recentVisits={recentVisits}
    />
  );
}
