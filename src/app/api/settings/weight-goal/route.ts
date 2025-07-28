import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import WeightGoal from "@/models/WeightGoal";

interface WeightGoal {
  _id?: string;
  userId: string;
  goalType: 'lose' | 'gain' | 'maintain';
  targetWeight: number;
  currentWeight: number;
  startDate: string;
  targetDate: string;
  weeklyGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

// GET: Retrieve user's weight goal
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Get user ID from email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the user's weight goal
    const weightGoal = await WeightGoal.findOne({ userId: user._id });

    return NextResponse.json({ weightGoal });
      } catch (error: unknown) {
      console.error("Get weight goal error:", error);
      return NextResponse.json(
        { error: "Failed to retrieve weight goal" },
        { status: 500 }
      );
    }
}

// POST: Create or update user's weight goal
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { goalType, currentWeight, targetWeight, targetDate, weeklyGoal, startDate } = body;

    // Validate required fields
    if (!goalType || !currentWeight || !targetWeight || !targetDate || !weeklyGoal) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Get user ID from email
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create or update weight goal
    const weightGoal = await WeightGoal.findOneAndUpdate(
      { userId: user._id },
      {
        userId: user._id,
        goalType,
        currentWeight,
        targetWeight,
        startDate,
        targetDate,
        weeklyGoal,
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ weightGoal });
      } catch (error: unknown) {
      console.error("Save weight goal error:", error);
      return NextResponse.json(
        { error: "Failed to save weight goal" },
        { status: 500 }
      );
    }
} 