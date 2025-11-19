import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';

export async function GET() {
  try {
    // Check if MONGODB_URI exists
    if (!process.env.MONGODB_URI) {
      return NextResponse.json(
        { 
          error: 'MONGODB_URI not found',
          env: Object.keys(process.env).filter(key => key.includes('MONGO'))
        },
        { status: 500 }
      );
    }

    // Try to connect
    await connectDB();
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'MongoDB connected successfully!',
        uri: process.env.MONGODB_URI.substring(0, 30) + '...' // Show partial URI for verification
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'MongoDB connection failed', 
        message: error.message,
        hasUri: !!process.env.MONGODB_URI
      },
      { status: 500 }
    );
  }
}
