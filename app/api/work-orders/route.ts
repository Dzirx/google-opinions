import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUserBusiness } from '@/lib/api/get-user-business';

function mapItemData(item: any) {
  return {
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
    inventoryItemIdOp: item.inventoryItemIdOp || null,
    inventoryItemIdOl: item.inventoryItemIdOl || null,
    inventoryItemIdFrame: item.inventoryItemIdFrame || null,
  };
}

function buildInventoryAdjustments(
  adjustments: Record<string, number>,
  idOp: string | null | undefined,
  idOl: string | null | undefined,
  delta: number,
) {
  if (idOp) adjustments[idOp] = (adjustments[idOp] || 0) + delta;
  if (idOl) adjustments[idOl] = (adjustments[idOl] || 0) + delta;
}

// GET - List all work orders for business
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) {
      return NextResponse.json({ error: 'Nie znaleziono firmy' }, { status: 404 });
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
    return NextResponse.json({ error: 'Nie udało się pobrać zleceń' }, { status: 500 });
  }
}

// POST - Create new work order
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) {
      return NextResponse.json({ error: 'Nie znaleziono firmy' }, { status: 404 });
    }

    const body = await req.json();
    const { customerId, orderNumber: customOrderNumber, receivedAt, pickupDate, status, totalAmount, deposit, notes, items } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'Wymagane ID klienta' }, { status: 400 });
    }
    if (!receivedAt) {
      return NextResponse.json({ error: 'Data przyjęcia jest wymagana' }, { status: 400 });
    }

    const customer = await db.customer.findFirst({
      where: { id: customerId, businessId: userBusiness.id },
    });
    if (!customer) {
      return NextResponse.json({ error: 'Nie znaleziono klienta' }, { status: 404 });
    }

    let orderNumber: string;
    if (customOrderNumber?.trim()) {
      orderNumber = customOrderNumber.trim();
    } else {
      const year = new Date().getFullYear();
      const count = await db.workOrder.count({ where: { businessId: userBusiness.id } });
      orderNumber = `ZL/${year}/${String(count + 1).padStart(3, '0')}`;
    }

    // Build inventory adjustments for new items
    const inventoryAdjustments: Record<string, number> = {};
    for (const item of (items || [])) {
      buildInventoryAdjustments(inventoryAdjustments, item.inventoryItemIdOp || null, item.inventoryItemIdOl || null, -1);
      if (item.inventoryItemIdFrame) inventoryAdjustments[item.inventoryItemIdFrame] = (inventoryAdjustments[item.inventoryItemIdFrame] || 0) - 1;
    }

    const workOrder = await db.$transaction(async (tx) => {
      const created = await tx.workOrder.create({
        data: {
          businessId: userBusiness.id,
          customerId,
          orderNumber,
          receivedAt: new Date(receivedAt),
          pickupDate: pickupDate ? new Date(pickupDate) : null,
          status: status || 'pending',
          totalAmount: totalAmount ? parseFloat(totalAmount) : null,
          deposit: deposit ? parseFloat(deposit) : null,
          notes: notes || null,
          items: {
            create: (items || []).map(mapItemData),
          },
        },
        include: { items: true, customer: true },
      });

      for (const [id, delta] of Object.entries(inventoryAdjustments)) {
        if (delta !== 0) {
          await tx.inventoryItem.update({
            where: { id },
            data: { quantity: { increment: delta } },
          });
        }
      }

      return created;
    });

    return NextResponse.json({ workOrder }, { status: 201 });
  } catch (error) {
    console.error('Error creating work order:', error);
    return NextResponse.json({ error: 'Nie udało się utworzyć zlecenia' }, { status: 500 });
  }
}

// PATCH - Update work order
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) {
      return NextResponse.json({ error: 'Nie znaleziono firmy' }, { status: 404 });
    }

    const body = await req.json();
    const { id, customerId, orderNumber, receivedAt, pickupDate, status, totalAmount, deposit, notes, items } = body;

    if (!id) {
      return NextResponse.json({ error: 'Wymagane ID zlecenia' }, { status: 400 });
    }

    const existing = await db.workOrder.findFirst({
      where: { id, businessId: userBusiness.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Nie znaleziono zlecenia' }, { status: 404 });
    }

    const workOrder = await db.$transaction(async (tx) => {
      if (items !== undefined) {
        const isDbId = (itemId: string) => !itemId.startsWith('new-');
        const existingItems = await tx.workOrderItem.findMany({
          where: { workOrderId: id },
          select: { id: true, inventoryItemIdOp: true, inventoryItemIdOl: true, inventoryItemIdFrame: true },
        });

        const incomingDbItems = (items as any[]).filter(i => i.id && isDbId(i.id));
        const incomingNewItems = (items as any[]).filter(i => !i.id || !isDbId(i.id));
        const incomingIds = incomingDbItems.map((i: any) => i.id as string);

        const toDelete = existingItems.filter(ei => !incomingIds.includes(ei.id));
        const toUpdate = incomingDbItems;
        const toCreate = incomingNewItems;

        // Build inventory adjustments
        const inventoryAdjustments: Record<string, number> = {};

        // Deleted items → return to inventory
        for (const item of toDelete) {
          buildInventoryAdjustments(inventoryAdjustments, item.inventoryItemIdOp, item.inventoryItemIdOl, +1);
          if (item.inventoryItemIdFrame) inventoryAdjustments[item.inventoryItemIdFrame] = (inventoryAdjustments[item.inventoryItemIdFrame] || 0) + 1;
        }

        // New items → take from inventory
        for (const item of toCreate) {
          buildInventoryAdjustments(inventoryAdjustments, item.inventoryItemIdOp || null, item.inventoryItemIdOl || null, -1);
      if (item.inventoryItemIdFrame) inventoryAdjustments[item.inventoryItemIdFrame] = (inventoryAdjustments[item.inventoryItemIdFrame] || 0) - 1;
        }

        // Updated items → diff old vs new inventory links
        for (const newItem of toUpdate) {
          const oldItem = existingItems.find(ei => ei.id === newItem.id);
          if (!oldItem) continue;

          const oldOp = oldItem.inventoryItemIdOp || null;
          const newOp = newItem.inventoryItemIdOp || null;
          if (oldOp !== newOp) {
            if (oldOp) inventoryAdjustments[oldOp] = (inventoryAdjustments[oldOp] || 0) + 1;
            if (newOp) inventoryAdjustments[newOp] = (inventoryAdjustments[newOp] || 0) - 1;
          }

          const oldOl = oldItem.inventoryItemIdOl || null;
          const newOl = newItem.inventoryItemIdOl || null;
          if (oldOl !== newOl) {
            if (oldOl) inventoryAdjustments[oldOl] = (inventoryAdjustments[oldOl] || 0) + 1;
            if (newOl) inventoryAdjustments[newOl] = (inventoryAdjustments[newOl] || 0) - 1;
          }

          const oldFrame = oldItem.inventoryItemIdFrame || null;
          const newFrame = newItem.inventoryItemIdFrame || null;
          if (oldFrame !== newFrame) {
            if (oldFrame) inventoryAdjustments[oldFrame] = (inventoryAdjustments[oldFrame] || 0) + 1;
            if (newFrame) inventoryAdjustments[newFrame] = (inventoryAdjustments[newFrame] || 0) - 1;
          }
        }

        // Apply item changes
        if (toDelete.length > 0) {
          await tx.workOrderItem.deleteMany({ where: { id: { in: toDelete.map(i => i.id) } } });
        }
        for (const item of toUpdate) {
          await tx.workOrderItem.update({ where: { id: item.id }, data: mapItemData(item) });
        }
        for (const item of toCreate) {
          await tx.workOrderItem.create({ data: { workOrderId: id, ...mapItemData(item) } });
        }

        // Apply inventory adjustments
        for (const [invId, delta] of Object.entries(inventoryAdjustments)) {
          if (delta !== 0) {
            await tx.inventoryItem.update({
              where: { id: invId },
              data: { quantity: { increment: delta } },
            });
          }
        }
      }

      return tx.workOrder.update({
        where: { id },
        data: {
          customerId: customerId ?? existing.customerId,
          orderNumber: orderNumber?.trim() || existing.orderNumber,
          receivedAt: receivedAt ? new Date(receivedAt) : existing.receivedAt,
          pickupDate: pickupDate ? new Date(pickupDate) : null,
          status: status ?? existing.status,
          totalAmount: totalAmount !== undefined ? (totalAmount !== '' ? parseFloat(totalAmount) : null) : existing.totalAmount,
          deposit: deposit !== undefined ? (deposit !== '' ? parseFloat(deposit) : null) : existing.deposit,
          notes: notes !== undefined ? notes || null : existing.notes,
        },
        include: { items: { orderBy: { id: 'asc' } }, customer: true },
      });
    });

    return NextResponse.json({ workOrder });
  } catch (error) {
    console.error('Error updating work order:', error);
    return NextResponse.json({ error: 'Nie udało się zaktualizować zlecenia' }, { status: 500 });
  }
}

// DELETE - Delete work order
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });
    }

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) {
      return NextResponse.json({ error: 'Nie znaleziono firmy' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Wymagane ID zlecenia' }, { status: 400 });
    }

    const existing = await db.workOrder.findFirst({
      where: { id, businessId: userBusiness.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Nie znaleziono zlecenia' }, { status: 404 });
    }

    // Return all linked inventory items before cascade delete
    const itemsToReturn = await db.workOrderItem.findMany({
      where: { workOrderId: id },
      select: { inventoryItemIdOp: true, inventoryItemIdOl: true, inventoryItemIdFrame: true },
    });

    const inventoryAdjustments: Record<string, number> = {};
    for (const item of itemsToReturn) {
      buildInventoryAdjustments(inventoryAdjustments, item.inventoryItemIdOp, item.inventoryItemIdOl, +1);
      if (item.inventoryItemIdFrame) inventoryAdjustments[item.inventoryItemIdFrame] = (inventoryAdjustments[item.inventoryItemIdFrame] || 0) + 1;
    }

    await db.$transaction(async (tx) => {
      await tx.workOrder.delete({ where: { id } });
      for (const [invId, delta] of Object.entries(inventoryAdjustments)) {
        if (delta !== 0) {
          await tx.inventoryItem.update({
            where: { id: invId },
            data: { quantity: { increment: delta } },
          });
        }
      }
    });

    return NextResponse.json({ message: 'Work order deleted successfully' });
  } catch (error) {
    console.error('Error deleting work order:', error);
    return NextResponse.json({ error: 'Nie udało się usunąć zlecenia' }, { status: 500 });
  }
}
