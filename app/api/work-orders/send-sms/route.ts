import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { SmsProviderFactory } from '@/lib/sms/providers/factory';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBusiness = await db.business.findFirst({
      where: { userId: session.user.id },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { workOrderId } = body;

    if (!workOrderId) {
      return NextResponse.json({ error: 'Work order ID is required' }, { status: 400 });
    }

    const workOrder = await db.workOrder.findFirst({
      where: { id: workOrderId, businessId: userBusiness.id },
      include: { customer: true },
    });

    if (!workOrder) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    if (!workOrder.customer.smsConsent) {
      return NextResponse.json({ error: 'Customer has not consented to receive SMS' }, { status: 400 });
    }

    if (!userBusiness.smsConfig || !userBusiness.smsProvider) {
      return NextResponse.json({ error: 'SMS provider not configured' }, { status: 400 });
    }

    const template = userBusiness.reviewSmsTemplate;
    if (!template) {
      return NextResponse.json({ error: 'Review SMS template not configured' }, { status: 400 });
    }

    const customerFullName = `${workOrder.customer.name} ${workOrder.customer.surname}`;
    const orderDate = new Date(workOrder.receivedAt).toLocaleDateString('pl-PL');

    const message = template
      .replace(/{name}/g, customerFullName)
      .replace(/{staff}/g, userBusiness.name)
      .replace(/{link}/g, userBusiness.googleReviewUrl)
      .replace(/{date}/g, orderDate);

    const smsProvider = SmsProviderFactory.create(
      userBusiness.smsProvider as any,
      userBusiness.smsConfig as any
    );

    const smsResult = await smsProvider.sendSms(workOrder.customer.phone, message);

    return NextResponse.json({
      message: 'Review SMS sent successfully',
      smsResult,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json({
      error: 'Failed to send SMS',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
