import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments, businesses, smsLogs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { SmsProviderFactory, generateReviewRequestSms } from '@/lib/sms';

// POST /api/appointments/send-sms - Manually send SMS for appointment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { appointmentId } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    // Get user's business with SMS config
    const userBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.userId, session.user.id),
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found. Please create a business first.' }, { status: 404 });
    }

    // Validate SMS provider configuration
    if (!userBusiness.smsProvider || !userBusiness.smsConfig) {
      return NextResponse.json(
        { error: 'SMS provider not configured. Please configure SMS settings in Settings page.' },
        { status: 400 }
      );
    }

    // Get appointment
    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.businessId, userBusiness.id)
      ),
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Check if SMS already sent
    if (appointment.smsStatus === 'sent') {
      return NextResponse.json(
        { error: 'SMS already sent for this appointment' },
        { status: 400 }
      );
    }

    // Generate SMS message
    const smsMessage = generateReviewRequestSms({
      customerName: appointment.customerName,
      businessName: userBusiness.name,
      googleReviewUrl: userBusiness.googleReviewUrl,
    });

    // Create SMS provider
    let smsProvider;
    try {
      smsProvider = SmsProviderFactory.create(
        userBusiness.smsProvider,
        userBusiness.smsConfig
      );
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Failed to initialize SMS provider',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Send SMS
    let smsResult;
    try {
      smsResult = await smsProvider.sendSms(appointment.customerPhone, smsMessage);
    } catch (error) {
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

      return NextResponse.json(
        {
          error: 'Failed to send SMS',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Check if SMS was successful
    if (!smsResult.success) {
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

      return NextResponse.json(
        {
          error: 'SMS sending failed',
          details: smsResult.error || 'Unknown error'
        },
        { status: 500 }
      );
    }

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
    const [updatedAppointment] = await db
      .update(appointments)
      .set({
        smsStatus: 'sent',
        smsSentAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, appointment.id))
      .returning();

    return NextResponse.json({
      message: 'SMS sent successfully',
      appointment: updatedAppointment,
      smsResult: {
        messageId: smsResult.messageId,
        cost: smsResult.cost,
      },
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    return NextResponse.json(
      {
        error: 'Failed to send SMS',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
