import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { getUserBusiness } from '@/lib/api/get-user-business';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) return NextResponse.json({ error: 'Nie znaleziono firmy' }, { status: 404 });

    const items = await db.inventoryItem.findMany({
      where: { businessId: userBusiness.id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: 'Nie udało się pobrać magazynu' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) return NextResponse.json({ error: 'Nie znaleziono firmy' }, { status: 404 });

    const body = await req.json();
    const { name, quantity, unit, category, sph, cyl, diameter, price, notes } = body;

    if (!name?.trim()) return NextResponse.json({ error: 'Nazwa jest wymagana' }, { status: 400 });
    if (quantity === undefined || quantity === '') return NextResponse.json({ error: 'Ilość jest wymagana' }, { status: 400 });

    const item = await db.inventoryItem.create({
      data: {
        businessId: userBusiness.id,
        name: name.trim(),
        quantity: parseInt(quantity),
        unit: unit || 'szt.',
        category: category?.trim() || null,
        sph: sph !== '' && sph != null ? parseFloat(sph) : null,
        cyl: cyl !== '' && cyl != null ? parseFloat(cyl) : null,
        diameter: diameter !== '' && diameter != null ? parseFloat(diameter) : null,
        price: price !== '' && price != null ? parseFloat(price) : null,
        notes: notes?.trim() || null,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory item:', error);
    return NextResponse.json({ error: 'Nie udało się dodać pozycji' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) return NextResponse.json({ error: 'Nie znaleziono firmy' }, { status: 404 });

    const body = await req.json();
    const { id, name, quantity, unit, category, sph, cyl, diameter, price, notes } = body;

    if (!id) return NextResponse.json({ error: 'Wymagane ID pozycji' }, { status: 400 });

    const existing = await db.inventoryItem.findFirst({ where: { id, businessId: userBusiness.id } });
    if (!existing) return NextResponse.json({ error: 'Nie znaleziono pozycji' }, { status: 404 });

    const item = await db.inventoryItem.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(unit !== undefined && { unit }),
        ...(category !== undefined && { category: category?.trim() || null }),
        ...(sph !== undefined && { sph: sph !== '' && sph != null ? parseFloat(sph) : null }),
        ...(cyl !== undefined && { cyl: cyl !== '' && cyl != null ? parseFloat(cyl) : null }),
        ...(diameter !== undefined && { diameter: diameter !== '' && diameter != null ? parseFloat(diameter) : null }),
        ...(price !== undefined && { price: price !== '' && price != null ? parseFloat(price) : null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Error updating inventory item:', error);
    return NextResponse.json({ error: 'Nie udało się zaktualizować pozycji' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Nieautoryzowany' }, { status: 401 });

    const userBusiness = await getUserBusiness(session.user.id);
    if (!userBusiness) return NextResponse.json({ error: 'Nie znaleziono firmy' }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Wymagane ID pozycji' }, { status: 400 });

    const existing = await db.inventoryItem.findFirst({ where: { id, businessId: userBusiness.id } });
    if (!existing) return NextResponse.json({ error: 'Nie znaleziono pozycji' }, { status: 404 });

    await db.inventoryItem.delete({ where: { id } });

    return NextResponse.json({ message: 'Pozycja usunięta' });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    return NextResponse.json({ error: 'Nie udało się usunąć pozycji' }, { status: 500 });
  }
}
