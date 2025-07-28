import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Food from "@/models/Food";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const foods = await Food.find({ userId: user._id }).sort({ createdAt: -1 });
    return NextResponse.json(foods);
  } catch (error: any) {
    console.error("Error fetching foods:", error);
    return NextResponse.json(
      { error: "Failed to fetch foods" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      name,
      description,
      date,
      time,
      food_items,
      total_calories,
      total_protein,
      total_carbs,
      total_fat,
      total_fiber,
      total_sugar,
      total_sodium,
      meal_type,
      estimated_portion_size,
      tags = [],
    } = body;

    if (!name || !date) {
      return NextResponse.json(
        { error: "Name and date are required" },
        { status: 400 }
      );
    }

    const food = new Food({
      userId: user._id,
      name,
      description,
      date,
      time,
      food_items,
      total_calories,
      total_protein,
      total_carbs,
      total_fat,
      total_fiber,
      total_sugar,
      total_sodium,
      meal_type,
      estimated_portion_size,
      tags,
    });

    await food.save();
    return NextResponse.json(food);
  } catch (error: any) {
    console.error("Error saving food:", error);
    return NextResponse.json(
      { error: "Failed to save food analysis" },
      { status: 500 }
    );
  }
} 