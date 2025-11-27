import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import MonthlyIncome from '@/models/MonthlyIncome';

// GET: Fetch monthly income for a specific month/year
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const month = searchParams.get('month');
    const year = searchParams.get('year');

    if (!familyId || !month || !year) {
      return NextResponse.json(
        { error: 'familyId, month, and year are required' },
        { status: 400 }
      );
    }

    const monthlyIncome = await MonthlyIncome.findOne({
      familyId,
      month: parseInt(month),
      year: parseInt(year),
    });

    return NextResponse.json({
      success: true,
      monthlyIncome: monthlyIncome || null,
    });
  } catch (error) {
    console.error('Error fetching monthly income:', error);
    return NextResponse.json(
      { error: 'Failed to fetch monthly income' },
      { status: 500 }
    );
  }
}

// POST: Create or update monthly income
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const body = await request.json();
    const { familyId, month, year, incomes } = body;

    if (!familyId || !month || !year || !incomes) {
      return NextResponse.json(
        { error: 'familyId, month, year, and incomes are required' },
        { status: 400 }
      );
    }

    // Validate month and year
    if (month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Month must be between 1 and 12' },
        { status: 400 }
      );
    }

    if (year < 2000 || year > 2100) {
      return NextResponse.json(
        { error: 'Year must be between 2000 and 2100' },
        { status: 400 }
      );
    }

    // Calculate total
    const totalIncome = incomes.reduce((sum: number, income: { amount: number }) => sum + income.amount, 0);

    // Upsert: update if exists, create if not
    const monthlyIncome = await MonthlyIncome.findOneAndUpdate(
      { familyId, month, year },
      {
        familyId,
        month,
        year,
        incomes,
        totalIncome,
        updatedAt: new Date(),
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return NextResponse.json({
      success: true,
      monthlyIncome,
    });
  } catch (error) {
    console.error('Error saving monthly income:', error);
    return NextResponse.json(
      { error: 'Failed to save monthly income' },
      { status: 500 }
    );
  }
}
