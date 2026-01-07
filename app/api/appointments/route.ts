import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments, businesses } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/appointments - Fetch all appointments for user's business
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const userBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.userId, session.user.id),
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found. Please create a business first.' }, { status: 404 });
    }

    // Fetch all appointments for this business
    const allAppointments = await db.query.appointments.findMany({
      where: eq(appointments.businessId, userBusiness.id),
      orderBy: [desc(appointments.appointmentDate)],
    });

    return NextResponse.json({ appointments: allAppointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

// POST /api/appointments - Create new appointment
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const userBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.userId, session.user.id),
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found. Please create a business first.' }, { status: 404 });
    }

    const body = await req.json();
    const { customerName, customerPhone, appointmentDate, scheduledSmsDate } = body;

    // Validation
    if (!customerName || !customerPhone || !appointmentDate || !scheduledSmsDate) {
      return NextResponse.json(
        { error: 'Missing required fields: customerName, customerPhone, appointmentDate, scheduledSmsDate' },
        { status: 400 }
      );
    }

    // Validate phone number format (basic)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use international format (e.g., +48123456789)' },
        { status: 400 }
      );
    }

    // Validate dates
    const apptDate = new Date(appointmentDate);
    const smsDate = new Date(scheduledSmsDate);

    if (isNaN(apptDate.getTime()) || isNaN(smsDate.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    if (smsDate > apptDate) {
      return NextResponse.json(
        { error: 'Scheduled SMS date must be before or equal to appointment date' },
        { status: 400 }
      );
    }

    // Create appointment
    const [newAppointment] = await db.insert(appointments).values({
      businessId: userBusiness.id,
      customerName,
      customerPhone: customerPhone.replace(/\s/g, ''), // Remove spaces
      appointmentDate: apptDate,
      scheduledSmsDate: smsDate,
      smsStatus: 'pending',
    }).returning();

    return NextResponse.json({ appointment: newAppointment }, { status: 201 });
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
  }
}

// PATCH /api/appointments - Update appointment
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, customerName, customerPhone, appointmentDate, scheduledSmsDate } = body;

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    // Get user's business
    const userBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.userId, session.user.id),
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if appointment exists and belongs to user's business
    const existingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.businessId, userBusiness.id)
      ),
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Cannot update if SMS already sent
    if (existingAppointment.smsStatus === 'sent') {
      return NextResponse.json(
        { error: 'Cannot update appointment - SMS already sent' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (customerName) updateData.customerName = customerName;
    if (customerPhone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      const cleanPhone = customerPhone.replace(/\s/g, '');
      if (!phoneRegex.test(cleanPhone)) {
        return NextResponse.json(
          { error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
      updateData.customerPhone = cleanPhone;
    }
    if (appointmentDate) {
      const apptDate = new Date(appointmentDate);
      if (isNaN(apptDate.getTime())) {
        return NextResponse.json({ error: 'Invalid appointment date' }, { status: 400 });
      }
      updateData.appointmentDate = apptDate;
    }
    if (scheduledSmsDate) {
      const smsDate = new Date(scheduledSmsDate);
      if (isNaN(smsDate.getTime())) {
        return NextResponse.json({ error: 'Invalid SMS date' }, { status: 400 });
      }
      updateData.scheduledSmsDate = smsDate;
    }

    // Validate SMS date is before appointment date
    const finalApptDate = updateData.appointmentDate || existingAppointment.appointmentDate;
    const finalSmsDate = updateData.scheduledSmsDate || existingAppointment.scheduledSmsDate;
    if (new Date(finalSmsDate) > new Date(finalApptDate)) {
      return NextResponse.json(
        { error: 'Scheduled SMS date must be before or equal to appointment date' },
        { status: 400 }
      );
    }

    // Update appointment
    const [updatedAppointment] = await db
      .update(appointments)
      .set(updateData)
      .where(eq(appointments.id, id))
      .returning();

    return NextResponse.json({ appointment: updatedAppointment });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}

// DELETE /api/appointments - Delete appointment
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Appointment ID is required' }, { status: 400 });
    }

    // Get user's business
    const userBusiness = await db.query.businesses.findFirst({
      where: eq(businesses.userId, session.user.id),
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    // Check if appointment exists and belongs to user's business
    const existingAppointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, id),
        eq(appointments.businessId, userBusiness.id)
      ),
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // Delete appointment (smsLogs will be cascade deleted)
    await db.delete(appointments).where(eq(appointments.id, id));

    return NextResponse.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json({ error: 'Failed to delete appointment' }, { status: 500 });
  }
}
