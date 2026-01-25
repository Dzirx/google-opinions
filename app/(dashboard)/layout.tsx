import { auth, signOut } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LanguageProvider } from '@/lib/i18n/language-context';
import { DashboardSidebar } from '@/components/dashboard-sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const handleSignOut = async () => {
    'use server';
    await signOut({ redirectTo: '/login' });
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-gray-100 flex">
        {/* Sidebar */}
        <DashboardSidebar
          userEmail={session.user.email || ''}
          userRole={session.user.role || 'user'}
          signOutAction={handleSignOut}
        />

        {/* Main Content */}
        <div className="flex-1 ml-64">
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </LanguageProvider>
  );
}
