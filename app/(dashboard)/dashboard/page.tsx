import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { customers, visits, businesses } from '@/lib/db/schema';
import { eq, desc, gte, or } from 'drizzle-orm';
import Link from 'next/link';

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
    <div className="px-4 py-6 sm:px-0">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {session.user.name || session.user.email}!
      </h1>
      <p className="text-gray-500 mb-8">
        Here's what's happening with your review requests today.
      </p>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {/* Total Customers */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Customers</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.totalCustomers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Total Visits */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Visits</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.totalVisits}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Sent */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">SMS Sent</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{totalSmsSent}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Pending */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">SMS Pending</dt>
                  <dd className="text-3xl font-semibold text-gray-900">{stats.smsPending}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Rate & Upcoming */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 mb-8">
        {/* Success Rate */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Success Rate</h3>
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${successRate * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900">{successRate}%</span>
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              {totalSmsSent} of {totalSmsOpportunities} SMS delivered successfully
            </p>
          </div>
        </div>

        {/* Upcoming Visits */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Visits</h3>
            <div className="flex items-center justify-center h-32">
              <div>
                <div className="text-6xl font-bold text-blue-600">{stats.upcomingVisits}</div>
                <p className="text-center text-sm text-gray-500 mt-2">visits scheduled</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Visits */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Visits</h3>
            <p className="mt-1 text-sm text-gray-500">Latest 5 visits created</p>
          </div>
          <Link href="/visits" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View all →
          </Link>
        </div>
        <div className="border-t border-gray-200">
          {recentVisits.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">
              No visits yet. Create your first visit to get started!
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {recentVisits.map((visit) => (
                <li key={visit.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {visit.customerName}
                      </p>
                      <p className="text-sm text-gray-500">{visit.customerPhone}</p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-sm text-gray-500">
                        {new Date(visit.visitDate).toLocaleDateString()}
                      </div>
                      <div className="flex gap-1">
                        {visit.reminderSmsStatus && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            visit.reminderSmsStatus === 'sent' ? 'bg-blue-100 text-blue-800' :
                            visit.reminderSmsStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            R
                          </span>
                        )}
                        {visit.reviewSmsStatus && (
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            visit.reviewSmsStatus === 'sent' ? 'bg-green-100 text-green-800' :
                            visit.reviewSmsStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            V
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Link
              href="/visits"
              className="relative block w-full border-2 border-blue-300 border-dashed rounded-lg p-6 text-center hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">New Visit</span>
            </Link>

            <Link
              href="/customers"
              className="relative block w-full border-2 border-green-300 border-dashed rounded-lg p-6 text-center hover:border-green-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">Import CSV</span>
            </Link>

            <Link
              href="/settings"
              className="relative block w-full border-2 border-gray-300 border-dashed rounded-lg p-6 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
