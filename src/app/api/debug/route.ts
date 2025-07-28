import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      MONGODB_URI: !!process.env.MONGODB_URI,
      OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
    };

    // Test database connection
    let dbStatus = "Not tested";
    let userCount = 0;
    
    try {
      await dbConnect();
      dbStatus = "Connected";
      
      // Count users
      userCount = await User.countDocuments();
    } catch (dbError) {
      dbStatus = `Error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      environment: envCheck,
      database: {
        status: dbStatus,
        userCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
} 