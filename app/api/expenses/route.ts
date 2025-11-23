import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Expense from '@/models/Expense';

// GET all expenses for a family
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

    const expenses = await Expense.find({ familyId }).sort({ date: -1 });

    return NextResponse.json({ expenses }, { status: 200 });
  } catch (error: any) {
    console.error('Get expenses error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST create new expense
export async function POST(request: Request) {
  try {
    const { familyId, date, amount, category, subcategory, description } = await request.json();

    // Validate input
    if (!familyId || !date || !amount || !category || !description) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Parse date as UTC to avoid timezone shifts
    const [year, month, day] = date.split('-').map(Number);
    const utcDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    const expense = await Expense.create({
      familyId,
      date: utcDate,
      amount,
      category,
      subcategory,
      description,
    });

    return NextResponse.json(
      { message: 'Expense added successfully', expense },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create expense error:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}

// DELETE expense
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Expense ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    await Expense.findByIdAndDelete(id);

    return NextResponse.json(
      { message: 'Expense deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete expense error:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
