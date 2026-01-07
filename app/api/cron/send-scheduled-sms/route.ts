import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { appointments, smsLogs } from '@/lib/db/schema';
import { eq, and, lte } from 'drizzle-orm';
import { SmsProviderFactory, generateReviewRequestSms } from '@/lib/sms';

/**
 * Cron job to send scheduled SMS messages
 *
 * This endpoint should be called periodically (e.g., every 5-15 minutes) by a cron service like:
 * - cron-job.org
 * - EasyCron
 * - GitHub Actions
 * - Server cron (crontab)
 *
 * Security: Requires CRON_SECRET in headers to prevent unauthorized access
 *
 * Example cron schedule: (every 15 minutes)*/
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('CRON_SECRET not configured in environment variables');
      return NextResponse.json(
        { error: 'Cron service not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('Unauthorized cron attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date();
    console.log(`[CRON] Starting scheduled SMS job at ${now.toISOString()}`);

    // Find all appointments where:
    // 1. SMS status is 'pending'
    // 2. scheduledSmsDate is now or in the past
    const pendingAppointments = await db.query.appointments.findMany({
      where: and(
        eq(appointments.smsStatus, 'pending'),
        lte(appointments.scheduledSmsDate, now)
      ),
      with: {
        business: true,
      },
    });

    console.log(`[CRON] Found ${pendingAppointments.length} appointments to process`);

    const results = {
      processed: 0,
      sent: 0,
      failed: 0,
      errors: [] as Array<{ appointmentId: string; error: string }>,
    };

    // Process each appointment
    for (const appointment of pendingAppointments) {
      results.processed++;

      try {
        const business = appointment.business;

        // Validate business SMS configuration
        if (!business.smsProvider || !business.smsConfig) {
          console.warn(`[CRON] Business ${business.id} has no SMS configuration`);
          results.errors.push({
            appointmentId: appointment.id,
            error: 'Business SMS provider not configured',
          });

          // Mark as failed
          await db
            .update(appointments)
            .set({
              smsStatus: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(appointments.id, appointment.id));

          // Log error
          await db.insert(smsLogs).values({
            appointmentId: appointment.id,
            phone: appointment.customerPhone,
            message: '',
            status: 'failed',
            errorMessage: 'Business SMS provider not configured',
          });

          results.failed++;
          continue;
        }

        // Generate SMS message
        const smsMessage = generateReviewRequestSms({
          customerName: appointment.customerName,
          businessName: business.name,
          googleReviewUrl: business.googleReviewUrl,
        });

        // Create SMS provider
        let smsProvider;
        try {
          smsProvider = SmsProviderFactory.create(
            business.smsProvider,
            business.smsConfig
          );
        } catch (error) {
          console.error(`[CRON] Failed to create SMS provider for business ${business.id}:`, error);
          results.errors.push({
            appointmentId: appointment.id,
            error: error instanceof Error ? error.message : 'Failed to create SMS provider',
          });

          // Mark as failed
          await db
            .update(appointments)
            .set({
              smsStatus: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(appointments.id, appointment.id));

          // Log error
          await db.insert(smsLogs).values({
            appointmentId: appointment.id,
            phone: appointment.customerPhone,
            message: smsMessage,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Failed to create SMS provider',
          });

          results.failed++;
          continue;
        }

        // Send SMS
        let smsResult;
        try {
          smsResult = await smsProvider.sendSms(appointment.customerPhone, smsMessage);
        } catch (error) {
          console.error(`[CRON] SMS sending error for appointment ${appointment.id}:`, error);

          // Log failed SMS
          await db.insert(smsLogs).values({
            appointmentId: appointment.id,
            phone: appointment.customerPhone,
            message: smsMessage,
            status: 'failed',
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });

          // Update appointment status
          await db
            .update(appointments)
            .set({
              smsStatus: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(appointments.id, appointment.id));

          results.errors.push({
            appointmentId: appointment.id,
            error: error instanceof Error ? error.message : 'SMS sending failed',
          });

          results.failed++;
          continue;
        }

        // Check if SMS was successful
        if (!smsResult.success) {
          console.warn(`[CRON] SMS failed for appointment ${appointment.id}: ${smsResult.error}`);

          // Log failed SMS
          await db.insert(smsLogs).values({
            appointmentId: appointment.id,
            phone: appointment.customerPhone,
            message: smsMessage,
            status: 'failed',
            errorMessage: smsResult.error || 'Unknown error',
            smsapiMessageId: smsResult.messageId || null,
          });

          // Update appointment status
          await db
            .update(appointments)
            .set({
              smsStatus: 'failed',
              updatedAt: new Date(),
            })
            .where(eq(appointments.id, appointment.id));

          results.errors.push({
            appointmentId: appointment.id,
            error: smsResult.error || 'SMS sending failed',
          });

          results.failed++;
          continue;
        }

        // Success! Log and update
        console.log(`[CRON] SMS sent successfully for appointment ${appointment.id}`);

        // Log successful SMS
        await db.insert(smsLogs).values({
          appointmentId: appointment.id,
          phone: appointment.customerPhone,
          message: smsMessage,
          status: 'sent',
          smsapiMessageId: smsResult.messageId || null,
          cost: smsResult.cost || null,
        });

        // Update appointment status
        await db
          .update(appointments)
          .set({
            smsStatus: 'sent',
            smsSentAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(appointments.id, appointment.id));

        results.sent++;
      } catch (error) {
        console.error(`[CRON] Unexpected error processing appointment ${appointment.id}:`, error);
        results.errors.push({
          appointmentId: appointment.id,
          error: error instanceof Error ? error.message : 'Unexpected error',
        });
        results.failed++;
      }
    }

    console.log(`[CRON] Job completed. Processed: ${results.processed}, Sent: ${results.sent}, Failed: ${results.failed}`);

    return NextResponse.json({
      message: 'Scheduled SMS job completed',
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('[CRON] Fatal error in scheduled SMS job:', error);
    return NextResponse.json(
      {
        error: 'Failed to process scheduled SMS',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
