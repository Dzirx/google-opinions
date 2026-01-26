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
    const { visitId, smsType } = body;

    if (!visitId || !smsType) {
      return NextResponse.json({ error: 'Visit ID and SMS type are required' }, { status: 400 });
    }

    if (smsType !== 'reminder' && smsType !== 'review') {
      return NextResponse.json({ error: 'SMS type must be "reminder" or "review"' }, { status: 400 });
    }

    // Get visit with customer
    const visit = await db.visit.findFirst({
      where: { id: visitId },
      include: {
        customer: true,
      },
    });

    if (!visit || visit.customer.businessId !== userBusiness.id) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Check SMS consent
    if (!visit.customer.smsConsent) {
      return NextResponse.json({ error: 'Customer has not consented to receive SMS' }, { status: 400 });
    }

    // Check if already sent
    if (smsType === 'reminder' && visit.reminderSmsStatus === 'sent') {
      return NextResponse.json({ error: 'Reminder SMS already sent' }, { status: 400 });
    }

    if (smsType === 'review' && visit.reviewSmsStatus === 'sent') {
      return NextResponse.json({ error: 'Review SMS already sent' }, { status: 400 });
    }

    // Verify SMS provider config
    if (!userBusiness.smsConfig || !userBusiness.smsProvider) {
      return NextResponse.json({ error: 'SMS provider not configured' }, { status: 400 });
    }

    // Select template based on SMS type
    const template = smsType === 'reminder'
      ? userBusiness.reminderSmsTemplate
      : userBusiness.reviewSmsTemplate;

    if (!template) {
      return NextResponse.json({ error: `${smsType} SMS template not configured` }, { status: 400 });
    }

    // Replace placeholders in template
    const customerFullName = `${visit.customer.name} ${visit.customer.surname}`;
    const visitDate = new Date(visit.visitDate).toLocaleDateString('pl-PL');

    const message = template
      .replace(/{name}/g, customerFullName)
      .replace(/{staff}/g, userBusiness.name)
      .replace(/{link}/g, userBusiness.googleReviewUrl)
      .replace(/{date}/g, visitDate);

    // Send SMS
    let smsResult;
    try {
      const smsProvider = SmsProviderFactory.create(
        userBusiness.smsProvider as any,
        userBusiness.smsConfig as any
      );

      smsResult = await smsProvider.sendSms(visit.customer.phone, message);
    } catch (smsError) {
      console.error('SMS sending failed:', smsError);

      // Log failed SMS
      await db.smsLog.create({
        data: {
          visitId: visit.id,
          smsType,
          phone: visit.customer.phone,
          message,
          status: 'failed',
          errorMessage: smsError instanceof Error ? smsError.message : 'Unknown error',
        },
      });

      // Update visit status to failed
      if (smsType === 'reminder') {
        await db.visit.update({
          where: { id: visit.id },
          data: {
            reminderSmsStatus: 'failed',
          },
        });
      } else {
        await db.visit.update({
          where: { id: visit.id },
          data: {
            reviewSmsStatus: 'failed',
          },
        });
      }

      return NextResponse.json({
        error: 'Failed to send SMS',
        details: smsError instanceof Error ? smsError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Log successful SMS
    await db.smsLog.create({
      data: {
        visitId: visit.id,
        smsType,
        phone: visit.customer.phone,
        message,
        status: 'sent',
        smsapiMessageId: smsResult.messageId || null,
        cost: smsResult.cost || null,
      },
    });

    // Update visit status
    const now = new Date();
    if (smsType === 'reminder') {
      await db.visit.update({
        where: { id: visit.id },
        data: {
          reminderSmsStatus: 'sent',
          reminderSmsSentAt: now,
        },
      });
    } else {
      await db.visit.update({
        where: { id: visit.id },
        data: {
          reviewSmsStatus: 'sent',
          reviewSmsSentAt: now,
        },
      });
    }

    return NextResponse.json({
      message: `${smsType} SMS sent successfully`,
      smsResult,
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json({ error: 'Failed to send SMS' }, { status: 500 });
  }
}
