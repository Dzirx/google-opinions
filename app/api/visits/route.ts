import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - List all visits for business (with customer data)
export async function GET() {
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

    // Get all customers for this business
    const businessCustomers = await db.customer.findMany({
      where: { businessId: userBusiness.id },
      include: {
        visits: {
          orderBy: { visitDate: 'desc' },
          include: {
            review: true,
          },
        },
      },
    });

    // Flatten visits with customer data
    const allVisits = businessCustomers.flatMap(customer =>
      customer.visits.map(visit => ({
        ...visit,
        customerName: `${customer.name} ${customer.surname}`,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        smsConsent: customer.smsConsent,
      }))
    );

    // Sort by visit date descending
    allVisits.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());

    return NextResponse.json({ visits: allVisits });
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Failed to fetch visits' }, { status: 500 });
  }
}

// POST - Create new visit
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
    const {
      customerId,
      visitDate,
      visitType,
      notes,
      reminderSmsDate,
      reviewSmsDate
    } = body;

    // Validation
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    if (!visitDate) {
      return NextResponse.json({ error: 'Visit date is required' }, { status: 400 });
    }

    // Verify customer exists and belongs to business
    const customer = await db.customer.findFirst({
      where: {
        id: customerId,
        businessId: userBusiness.id,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Validate dates
    const visit = new Date(visitDate);
    if (isNaN(visit.getTime())) {
      return NextResponse.json({ error: 'Invalid visit date' }, { status: 400 });
    }

    if (reminderSmsDate) {
      const reminder = new Date(reminderSmsDate);
      if (isNaN(reminder.getTime())) {
        return NextResponse.json({ error: 'Invalid reminder SMS date' }, { status: 400 });
      }
      // Reminder should be before visit
      if (reminder >= visit) {
        return NextResponse.json({ error: 'Reminder SMS date should be before visit date' }, { status: 400 });
      }
    }

    if (reviewSmsDate) {
      const review = new Date(reviewSmsDate);
      if (isNaN(review.getTime())) {
        return NextResponse.json({ error: 'Invalid review SMS date' }, { status: 400 });
      }
      // Review should be after visit
      if (review <= visit) {
        return NextResponse.json({ error: 'Review SMS date should be after visit date' }, { status: 400 });
      }
    }

    // Create visit
    const newVisit = await db.visit.create({
      data: {
        customerId,
        visitDate: visit,
        visitType: visitType || null,
        notes: notes || null,
        reminderSmsDate: reminderSmsDate ? new Date(reminderSmsDate) : null,
        reviewSmsDate: reviewSmsDate ? new Date(reviewSmsDate) : null,
      },
    });

    return NextResponse.json({ visit: newVisit }, { status: 201 });
  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json({ error: 'Failed to create visit' }, { status: 500 });
  }
}

// PATCH - Update visit
export async function PATCH(req: NextRequest) {
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
    const {
      id,
      customerId,
      visitDate,
      visitType,
      notes,
      reminderSmsDate,
      reviewSmsDate
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'Visit ID is required' }, { status: 400 });
    }

    // Get visit with customer to verify ownership
    const visit = await db.visit.findFirst({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!visit || visit.customer.businessId !== userBusiness.id) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Prevent editing if SMS already sent
    if (visit.reminderSmsStatus === 'sent' && reminderSmsDate !== undefined) {
      return NextResponse.json({ error: 'Cannot update reminder SMS date after it has been sent' }, { status: 400 });
    }

    if (visit.reviewSmsStatus === 'sent' && reviewSmsDate !== undefined) {
      return NextResponse.json({ error: 'Cannot update review SMS date after it has been sent' }, { status: 400 });
    }

    // Validate dates if provided
    const newVisitDate = visitDate ? new Date(visitDate) : new Date(visit.visitDate);
    if (visitDate && isNaN(newVisitDate.getTime())) {
      return NextResponse.json({ error: 'Invalid visit date' }, { status: 400 });
    }

    if (reminderSmsDate) {
      const reminder = new Date(reminderSmsDate);
      if (isNaN(reminder.getTime())) {
        return NextResponse.json({ error: 'Invalid reminder SMS date' }, { status: 400 });
      }
      if (reminder >= newVisitDate) {
        return NextResponse.json({ error: 'Reminder SMS date should be before visit date' }, { status: 400 });
      }
    }

    if (reviewSmsDate) {
      const review = new Date(reviewSmsDate);
      if (isNaN(review.getTime())) {
        return NextResponse.json({ error: 'Invalid review SMS date' }, { status: 400 });
      }
      if (review <= newVisitDate) {
        return NextResponse.json({ error: 'Review SMS date should be after visit date' }, { status: 400 });
      }
    }

    // Update visit
    const updateData: any = {};

    if (customerId !== undefined) updateData.customerId = customerId;
    if (visitDate !== undefined) updateData.visitDate = newVisitDate;
    if (visitType !== undefined) updateData.visitType = visitType;
    if (notes !== undefined) updateData.notes = notes;
    if (reminderSmsDate !== undefined) updateData.reminderSmsDate = reminderSmsDate ? new Date(reminderSmsDate) : null;
    if (reviewSmsDate !== undefined) updateData.reviewSmsDate = reviewSmsDate ? new Date(reviewSmsDate) : null;

    const updatedVisit = await db.visit.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ visit: updatedVisit });
  } catch (error) {
    console.error('Error updating visit:', error);
    return NextResponse.json({ error: 'Failed to update visit' }, { status: 500 });
  }
}

// DELETE - Delete visit
export async function DELETE(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Visit ID is required' }, { status: 400 });
    }

    // Get visit with customer to verify ownership
    const visit = await db.visit.findFirst({
      where: { id },
      include: {
        customer: true,
      },
    });

    if (!visit || visit.customer.businessId !== userBusiness.id) {
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    }

    // Delete visit (cascade deletes reviews, sms_logs)
    await db.visit.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Visit deleted successfully' });
  } catch (error) {
    console.error('Error deleting visit:', error);
    return NextResponse.json({ error: 'Failed to delete visit' }, { status: 500 });
  }
}
