import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import Family from '@/models/Family';

export async function POST(request: Request) {
  try {
    const { name, email, password, members, ages, genders } = await request.json();

    // Validate input
    if (!name || !email || !password || !members || !ages) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate ages
    if (ages.length !== members) {
      return NextResponse.json(
        { error: `Please enter ${members} ages (one for each family member)` },
        { status: 400 }
      );
    }

    // Validate genders (optional but if provided, should match)
    if (genders && genders.length !== members) {
      return NextResponse.json(
        { error: `Please enter ${members} genders (one for each family member)` },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if family already exists
    const existingFamily = await Family.findOne({ email: email.toLowerCase() });
    if (existingFamily) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new family
    const family = await Family.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      members,
      ages,
      genders: genders || [],
    });

    // Return family data without password
    const familyData = {
      id: family._id.toString(),
      name: family.name,
      email: family.email,
      members: family.members,
      ages: family.ages,
      genders: family.genders,
    };

    return NextResponse.json(
      { message: 'Family created successfully', family: familyData },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create family account' },
      { status: 500 }
    );
  }
}
