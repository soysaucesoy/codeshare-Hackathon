import { prisma } from '../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const facilities = await prisma.facility.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    return NextResponse.json(facilities);
  } catch (error) {
    console.error('事業所取得エラー:', error);
    return NextResponse.json({ error: '事業所の取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      name, 
      address, 
      phone, 
      email, 
      serviceType, 
      capacity, 
      description 
    } = body;

    if (!name) {
      return NextResponse.json({ error: '事業所名は必須です' }, { status: 400 });
    }

    const facility = await prisma.facility.create({
      data: {
        name,
        address: address || null,
        phone: phone || null,
        email: email || null,
        serviceType: serviceType || null,
        capacity: parseInt(capacity) || 0,
        description: description || null,
      },
    });

    return NextResponse.json(facility, { status: 201 });
  } catch (error) {
    console.error('事業所作成エラー:', error);
    return NextResponse.json({ error: '事業所の登録に失敗しました' }, { status: 500 });
  }
}