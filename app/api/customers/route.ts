import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - List all customers for business
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's business
    const userBusiness = await db.business.findUnique({
      where: { userId: session.user.id },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found. Please create a business first.' }, { status: 404 });
    }

    // Get all customers for business
    const allCustomers = await db.customer.findMany({
      where: { businessId: userBusiness.id },
      include: {
        visits: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ customers: allCustomers });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

// POST - Create new customer
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBusiness = await db.business.findUnique({
      where: { userId: session.user.id },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { name, surname, phone, email, smsConsent } = body;

    // Validation
    if (!name || !surname || !phone) {
      return NextResponse.json({ error: 'Name, surname and phone are required' }, { status: 400 });
    }

    if (name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (surname.length < 2) {
      return NextResponse.json({ error: 'Surname must be at least 2 characters' }, { status: 400 });
    }

    // E.164 phone format validation
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json({ error: 'Invalid phone number. Use E.164 format (e.g., +48123456789)' }, { status: 400 });
    }

    // Email validation (optional)
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }
    }

    // Check for duplicate phone in same business
    const existingCustomer = await db.customer.findFirst({
      where: {
        businessId: userBusiness.id,
        phone: phone,
      },
    });

    if (existingCustomer) {
      return NextResponse.json({ error: 'Customer with this phone number already exists' }, { status: 400 });
    }

    // Create customer
    const newCustomer = await db.customer.create({
      data: {
        businessId: userBusiness.id,
        name,
        surname,
        phone,
        email: email || null,
        smsConsent: smsConsent !== undefined ? smsConsent : true,
      },
    });

    return NextResponse.json({ customer: newCustomer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
  }
}

// PATCH - Update customer
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBusiness = await db.business.findUnique({
      where: { userId: session.user.id },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, name, surname, phone, email, smsConsent } = body;

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Verify customer belongs to this business
    const customer = await db.customer.findFirst({
      where: {
        id: id,
        businessId: userBusiness.id,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Validation
    if (name && name.length < 2) {
      return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
    }

    if (surname && surname.length < 2) {
      return NextResponse.json({ error: 'Surname must be at least 2 characters' }, { status: 400 });
    }

    if (phone) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
      }

      // Check for duplicate phone (excluding current customer)
      const existingCustomer = await db.customer.findFirst({
        where: {
          businessId: userBusiness.id,
          phone: phone,
        },
      });

      if (existingCustomer && existingCustomer.id !== id) {
        return NextResponse.json({ error: 'Another customer with this phone number already exists' }, { status: 400 });
      }
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
      }
    }

    // Update customer
    const updatedCustomer = await db.customer.update({
      where: { id: id },
      data: {
        ...(name && { name }),
        ...(surname && { surname }),
        ...(phone && { phone }),
        ...(email !== undefined && { email }),
        ...(smsConsent !== undefined && { smsConsent }),
      },
    });

    return NextResponse.json({ customer: updatedCustomer });
  } catch (error) {
    console.error('Error updating customer:', error);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

// DELETE - Delete customer
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBusiness = await db.business.findUnique({
      where: { userId: session.user.id },
    });

    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }

    // Verify customer belongs to this business
    const customer = await db.customer.findFirst({
      where: {
        id: id,
        businessId: userBusiness.id,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Delete customer (cascade deletes visits, reviews, sms_logs)
    await db.customer.delete({
      where: { id: id },
    });

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
