import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { SmsProviderFactory } from '@/lib/sms/providers/factory';

/**
 * Cron job to send scheduled SMS messages (reminder + review)
 *
 * This endpoint should be called periodically (e.g., every 5-15 minutes) by a cron service
 * Security: Requires CRON_SECRET in headers
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured');
      return NextResponse.json({ error: 'Cron service not configured' }, { status: 500 });
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    console.log(`[CRON] Starting scheduled SMS job at ${now.toISOString()}`);

    const results = {
      reminderSms: { processed: 0, sent: 0, failed: 0, skipped: 0 },
      reviewSms: { processed: 0, sent: 0, failed: 0, skipped: 0 },
      errors: [] as Array<{ visitId: string; type: string; error: string }>,
    };

    // Find pending reminder SMS (before visit)
    const pendingReminders = await db.visit.findMany({
      where: {
        reminderSmsDate: {
          not: null,
          lte: now,
        },
        reminderSmsStatus: 'pending',
      },
      include: {
        customer: {
          include: {
            business: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${pendingReminders.length} pending reminder SMS`);

    // Process reminder SMS
    for (const visit of pendingReminders) {
      results.reminderSms.processed++;
      await processSms(visit, 'reminder', results);
    }

    // Find pending review SMS (after visit)
    const pendingReviews = await db.visit.findMany({
      where: {
        reviewSmsDate: {
          not: null,
          lte: now,
        },
        reviewSmsStatus: 'pending',
      },
      include: {
        customer: {
          include: {
            business: true,
          },
        },
      },
    });

    console.log(`[CRON] Found ${pendingReviews.length} pending review SMS`);

    // Process review SMS
    for (const visit of pendingReviews) {
      results.reviewSms.processed++;
      await processSms(visit, 'review', results);
    }

    console.log(`[CRON] Job completed. Reminders: ${results.reminderSms.sent}/${results.reminderSms.processed}, Reviews: ${results.reviewSms.sent}/${results.reviewSms.processed}`);

    return NextResponse.json({
      message: 'Scheduled SMS job completed',
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('[CRON] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to process scheduled SMS', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function processSms(visit: any, smsType: 'reminder' | 'review', results: any) {
  try {
    const customer = visit.customer;
    const business = customer.business;

    // Check SMS consent
    if (!customer.smsConsent) {
      console.log(`[CRON] Skipping ${smsType} for visit ${visit.id} - customer has no SMS consent`);
      results[`${smsType}Sms`].skipped++;

      // Mark as failed with reason
      const statusField = smsType === 'reminder' ? 'reminderSmsStatus' : 'reviewSmsStatus';
      await db.visit.update({
        where: { id: visit.id },
        data: { [statusField]: 'failed' },
      });

      await db.smsLog.create({
        data: {
          visitId: visit.id,
          smsType,
          phone: customer.phone,
          message: '',
          status: 'failed',
          errorMessage: 'Customer has not consented to SMS',
        },
      });

      return;
    }

    // Validate business SMS configuration
    if (!business.smsProvider || !business.smsConfig) {
      console.warn(`[CRON] Business ${business.id} has no SMS configuration`);
      results.errors.push({ visitId: visit.id, type: smsType, error: 'No SMS configuration' });

      const statusField = smsType === 'reminder' ? 'reminderSmsStatus' : 'reviewSmsStatus';
      await db.visit.update({
        where: { id: visit.id },
        data: { [statusField]: 'failed' },
      });

      await db.smsLog.create({
        data: {
          visitId: visit.id,
          smsType,
          phone: customer.phone,
          message: '',
          status: 'failed',
          errorMessage: 'Business SMS provider not configured',
        },
      });

      results[`${smsType}Sms`].failed++;
      return;
    }

    // Get template
    const template = smsType === 'reminder' ? business.reminderSmsTemplate : business.reviewSmsTemplate;
    if (!template) {
      console.warn(`[CRON] Business ${business.id} missing ${smsType} template`);
      results.errors.push({ visitId: visit.id, type: smsType, error: 'Template not configured' });

      const statusField = smsType === 'reminder' ? 'reminderSmsStatus' : 'reviewSmsStatus';
      await db.visit.update({
        where: { id: visit.id },
        data: { [statusField]: 'failed' },
      });

      results[`${smsType}Sms`].failed++;
      return;
    }

    // Generate message from template
    const customerFullName = `${customer.name} ${customer.surname}`;
    const visitDate = new Date(visit.visitDate).toLocaleDateString('pl-PL');

    const message = template
      .replace(/{name}/g, customerFullName)
      .replace(/{staff}/g, business.name)
      .replace(/{link}/g, business.googleReviewUrl)
      .replace(/{date}/g, visitDate);

    // Create SMS provider
    let smsProvider;
    try {
      smsProvider = SmsProviderFactory.create(business.smsProvider as any, business.smsConfig as any);
    } catch (error) {
      console.error(`[CRON] Failed to create SMS provider:`, error);
      results.errors.push({ visitId: visit.id, type: smsType, error: 'Provider creation failed' });

      const statusField = smsType === 'reminder' ? 'reminderSmsStatus' : 'reviewSmsStatus';
      await db.visit.update({
        where: { id: visit.id },
        data: { [statusField]: 'failed' },
      });

      await db.smsLog.create({
        data: {
          visitId: visit.id,
          smsType,
          phone: customer.phone,
          message,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Provider creation failed',
        },
      });

      results[`${smsType}Sms`].failed++;
      return;
    }

    // Send SMS
    let smsResult;
    try {
      smsResult = await smsProvider.sendSms(customer.phone, message);
    } catch (error) {
      console.error(`[CRON] SMS sending error:`, error);

      await db.smsLog.create({
        data: {
          visitId: visit.id,
          smsType,
          phone: customer.phone,
          message,
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      const statusField = smsType === 'reminder' ? 'reminderSmsStatus' : 'reviewSmsStatus';
      await db.visit.update({
        where: { id: visit.id },
        data: { [statusField]: 'failed' },
      });

      results.errors.push({ visitId: visit.id, type: smsType, error: 'Sending failed' });
      results[`${smsType}Sms`].failed++;
      return;
    }

    // Success!
    console.log(`[CRON] ${smsType} SMS sent successfully for visit ${visit.id}`);

    await db.smsLog.create({
      data: {
        visitId: visit.id,
        smsType,
        phone: customer.phone,
        message,
        status: 'sent',
        smsapiMessageId: smsResult.messageId || null,
        cost: smsResult.cost || null,
      },
    });

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

    results[`${smsType}Sms`].sent++;
  } catch (error) {
    console.error(`[CRON] Unexpected error processing visit ${visit.id}:`, error);
    results.errors.push({ visitId: visit.id, type: smsType, error: 'Unexpected error' });
    results[`${smsType}Sms`].failed++;
  }
}
