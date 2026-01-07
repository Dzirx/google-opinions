import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { appointments, businesses } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface CsvRow {
  customerName: string;
  customerPhone: string;
  appointmentDate: string;
  scheduledSmsDate: string;
}

// POST /api/appointments/import - Import appointments from CSV
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
    const { csvData } = body;

    if (!csvData || !Array.isArray(csvData)) {
      return NextResponse.json(
        { error: 'Invalid CSV data. Expected array of objects.' },
        { status: 400 }
      );
    }

    if (csvData.length === 0) {
      return NextResponse.json(
        { error: 'CSV data is empty' },
        { status: 400 }
      );
    }

    // Validate CSV structure (first row)
    const firstRow = csvData[0];
    const requiredFields = ['customerName', 'customerPhone', 'appointmentDate', 'scheduledSmsDate'];
    const missingFields = requiredFields.filter(field => !(field in firstRow));

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required CSV columns: ${missingFields.join(', ')}`,
          hint: 'CSV must have columns: customerName, customerPhone, appointmentDate, scheduledSmsDate'
        },
        { status: 400 }
      );
    }

    const results = {
      success: [] as any[],
      errors: [] as { row: number; data: any; error: string }[],
    };

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;

    // Process each row
    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i] as CsvRow;
      const rowNumber = i + 1;

      try {
        // Validate required fields
        if (!row.customerName || !row.customerPhone || !row.appointmentDate || !row.scheduledSmsDate) {
          results.errors.push({
            row: rowNumber,
            data: row,
            error: 'Missing required fields'
          });
          continue;
        }

        // Validate phone number
        const cleanPhone = row.customerPhone.replace(/\s/g, '');
        if (!phoneRegex.test(cleanPhone)) {
          results.errors.push({
            row: rowNumber,
            data: row,
            error: `Invalid phone number format: ${row.customerPhone}. Use international format (e.g., +48123456789)`
          });
          continue;
        }

        // Validate dates
        const apptDate = new Date(row.appointmentDate);
        const smsDate = new Date(row.scheduledSmsDate);

        if (isNaN(apptDate.getTime())) {
          results.errors.push({
            row: rowNumber,
            data: row,
            error: `Invalid appointment date: ${row.appointmentDate}`
          });
          continue;
        }

        if (isNaN(smsDate.getTime())) {
          results.errors.push({
            row: rowNumber,
            data: row,
            error: `Invalid SMS date: ${row.scheduledSmsDate}`
          });
          continue;
        }

        if (smsDate > apptDate) {
          results.errors.push({
            row: rowNumber,
            data: row,
            error: 'Scheduled SMS date must be before or equal to appointment date'
          });
          continue;
        }

        // Insert appointment
        const [newAppointment] = await db.insert(appointments).values({
          businessId: userBusiness.id,
          customerName: row.customerName.trim(),
          customerPhone: cleanPhone,
          appointmentDate: apptDate,
          scheduledSmsDate: smsDate,
          smsStatus: 'pending',
        }).returning();

        results.success.push(newAppointment);
      } catch (error) {
        results.errors.push({
          row: rowNumber,
          data: row,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.success.length} successful, ${results.errors.length} failed`,
      summary: {
        total: csvData.length,
        successful: results.success.length,
        failed: results.errors.length,
      },
      successfulAppointments: results.success,
      errors: results.errors,
    }, { status: results.success.length > 0 ? 201 : 400 });
  } catch (error) {
    console.error('Error importing appointments:', error);
    return NextResponse.json({ error: 'Failed to import appointments' }, { status: 500 });
  }
}
