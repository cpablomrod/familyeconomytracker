import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Family from '@/models/Family';

// GET family profile
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');

    if (!familyId) {
      return NextResponse.json(
        { error: 'Family ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const family = await Family.findById(familyId).select('-password');
    
    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    // Convert _id to id for consistency
    const familyData = {
      id: family._id.toString(),
      name: family.name,
      email: family.email,
      members: family.members,
      ages: family.ages,
      incomeStreams: family.incomeStreams || [],
      fixedPayments: family.fixedPayments || [],
      properties: family.properties || [],
      loans: family.loans || [],
    };

    return NextResponse.json({ family: familyData }, { status: 200 });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PUT update family profile
export async function PUT(request: Request) {
  try {
    const { familyId, incomeStreams, fixedPayments, properties, loans } = await request.json();

    if (!familyId) {
      return NextResponse.json(
        { error: 'Family ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const updateData: any = {};
    if (incomeStreams !== undefined) updateData.incomeStreams = incomeStreams;
    if (fixedPayments !== undefined) updateData.fixedPayments = fixedPayments;
    if (properties !== undefined) updateData.properties = properties;
    if (loans !== undefined) updateData.loans = loans;

    const family = await Family.findByIdAndUpdate(
      familyId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!family) {
      return NextResponse.json(
        { error: 'Family not found' },
        { status: 404 }
      );
    }

    // Convert _id to id for consistency
    const familyData = {
      id: family._id.toString(),
      name: family.name,
      email: family.email,
      members: family.members,
      ages: family.ages,
      incomeStreams: family.incomeStreams || [],
      fixedPayments: family.fixedPayments || [],
      properties: family.properties || [],
      loans: family.loans || [],
    };

    return NextResponse.json(
      { message: 'Profile updated successfully', family: familyData },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
