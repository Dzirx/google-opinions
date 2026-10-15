import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUserBusiness } from '@/lib/api/get-user-business';
import { PrintToolbar } from './print-toolbar';
import { WorkOrderPrintSheet } from './work-order-print-sheet';
import styles from './print.module.css';

export default async function WorkOrderPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const business = await getUserBusiness(session.user.id);
  if (!business) {
    redirect('/login');
  }

  const workOrder = await db.workOrder.findFirst({
    where: { id, businessId: business.id },
    include: {
      customer: true,
      items: { orderBy: { id: 'asc' } },
    },
  });

  if (!workOrder) {
    notFound();
  }

  return (
    <div className={styles.screenWrapper}>
      <PrintToolbar />
      <WorkOrderPrintSheet workOrder={workOrder} business={business} />
    </div>
  );
}
