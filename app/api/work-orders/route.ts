import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';

async function getUserBusiness(userId: string) {
  return db.business.findFirst({ where: { userId } });
}

// GET - List all work orders for business
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const workOrders = await db.workOrder.findMany({
      where: { businessId: userBusiness.id },
      include: {
        customer: true,
        items: { orderBy: { id: 'asc' } },
      },
      orderBy: { receivedAt: 'desc' },
    });

    const result = workOrders.map(order => ({
      ...order,
      customerName: `${order.customer.name} ${order.customer.surname}`,
      customerPhone: order.customer.phone,
    }));

    return NextResponse.json({ workOrders: result });
  } catch (error) {
    console.error('Error fetching work orders:', error);
    return NextResponse.json({ error: 'Failed to fetch work orders' }, { status: 500 });
  }
}

// POST - Create new work order
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { customerId, receivedAt, dueAt, status, totalAmount, deposit, notes, items } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }
    if (!receivedAt) {
      return NextResponse.json({ error: 'Received date is required' }, { status: 400 });
    }

    const customer = await db.customer.findFirst({
      where: { id: customerId, businessId: userBusiness.id },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Auto-generate order number: ZL/YYYY/NNN
    const year = new Date().getFullYear();
    const count = await db.workOrder.count({
      where: { businessId: userBusiness.id },
    });
    const orderNumber = `ZL/${year}/${String(count + 1).padStart(3, '0')}`;

    const workOrder = await db.workOrder.create({
      data: {
        businessId: userBusiness.id,
        customerId,
        orderNumber,
        receivedAt: new Date(receivedAt),
        dueAt: dueAt ? new Date(dueAt) : null,
        status: status || 'pending',
        totalAmount: totalAmount ? parseFloat(totalAmount) : null,
        deposit: deposit ? parseFloat(deposit) : null,
        notes: notes || null,
        items: {
          create: (items || []).map((item: any) => ({
            type: item.type,
            opSph: item.opSph !== '' && item.opSph != null ? parseFloat(item.opSph) : null,
            opCyl: item.opCyl !== '' && item.opCyl != null ? parseFloat(item.opCyl) : null,
            opAxis: item.opAxis !== '' && item.opAxis != null ? parseInt(item.opAxis) : null,
            opAdd: item.opAdd !== '' && item.opAdd != null ? parseFloat(item.opAdd) : null,
            opPd: item.opPd !== '' && item.opPd != null ? parseFloat(item.opPd) : null,
            olSph: item.olSph !== '' && item.olSph != null ? parseFloat(item.olSph) : null,
            olCyl: item.olCyl !== '' && item.olCyl != null ? parseFloat(item.olCyl) : null,
            olAxis: item.olAxis !== '' && item.olAxis != null ? parseInt(item.olAxis) : null,
            olAdd: item.olAdd !== '' && item.olAdd != null ? parseFloat(item.olAdd) : null,
            olPd: item.olPd !== '' && item.olPd != null ? parseFloat(item.olPd) : null,
            frameModel: item.frameModel || null,
            ownFrame: item.ownFrame || false,
            lensType: item.lensType || null,
            framePrice: item.framePrice !== '' && item.framePrice != null ? parseFloat(item.framePrice) : null,
            lensPrice: item.lensPrice !== '' && item.lensPrice != null ? parseFloat(item.lensPrice) : null,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Failed to create work order' }, { status: 500 });
  }
}

// PATCH - Update work order
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const body = await req.json();
    const { id, customerId, receivedAt, dueAt, status, totalAmount, deposit, notes, items } = body;

    if (!id) {
      return NextResponse.json({ error: 'Work order ID is required' }, { status: 400 });
    }

    const existing = await db.workOrder.findFirst({
      where: { id, businessId: userBusiness.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    // Replace items: delete all, recreate
    await db.workOrderItem.deleteMany({ where: { workOrderId: id } });

    const workOrder = await db.workOrder.update({
      where: { id },
      data: {
        customerId: customerId ?? existing.customerId,
        receivedAt: receivedAt ? new Date(receivedAt) : existing.receivedAt,
        dueAt: dueAt ? new Date(dueAt) : null,
        status: status ?? existing.status,
        totalAmount: totalAmount !== undefined ? (totalAmount !== '' ? parseFloat(totalAmount) : null) : existing.totalAmount,
        deposit: deposit !== undefined ? (deposit !== '' ? parseFloat(deposit) : null) : existing.deposit,
        notes: notes !== undefined ? notes || null : existing.notes,
        items: {
          create: (items || []).map((item: any) => ({
            type: item.type,
            opSph: item.opSph !== '' && item.opSph != null ? parseFloat(item.opSph) : null,
            opCyl: item.opCyl !== '' && item.opCyl != null ? parseFloat(item.opCyl) : null,
            opAxis: item.opAxis !== '' && item.opAxis != null ? parseInt(item.opAxis) : null,
            opAdd: item.opAdd !== '' && item.opAdd != null ? parseFloat(item.opAdd) : null,
            opPd: item.opPd !== '' && item.opPd != null ? parseFloat(item.opPd) : null,
            olSph: item.olSph !== '' && item.olSph != null ? parseFloat(item.olSph) : null,
            olCyl: item.olCyl !== '' && item.olCyl != null ? parseFloat(item.olCyl) : null,
            olAxis: item.olAxis !== '' && item.olAxis != null ? parseInt(item.olAxis) : null,
            olAdd: item.olAdd !== '' && item.olAdd != null ? parseFloat(item.olAdd) : null,
            olPd: item.olPd !== '' && item.olPd != null ? parseFloat(item.olPd) : null,
            frameModel: item.frameModel || null,
            ownFrame: item.ownFrame || false,
            lensType: item.lensType || null,
            framePrice: item.framePrice !== '' && item.framePrice != null ? parseFloat(item.framePrice) : null,
            lensPrice: item.lensPrice !== '' && item.lensPrice != null ? parseFloat(item.lensPrice) : null,
          })),
        },
      },
      include: { items: true, customer: true },
    });

    return NextResponse.json({ workOrder });
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json({ error: 'Failed to update work order' }, { status: 500 });
  }
}

// DELETE - Delete work order
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Work order ID is required' }, { status: 400 });
    }

    const existing = await db.workOrder.findFirst({
      where: { id, businessId: userBusiness.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 });
    }

    await db.workOrder.delete({ where: { id } });

    return NextResponse.json({ message: 'Work order deleted successfully' });
  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json({ error: 'Failed to delete work order' }, { status: 500 });
  }
}
