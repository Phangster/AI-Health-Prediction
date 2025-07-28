import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Food from "@/models/Food";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (session.user as unknown as { id: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    // Validate the food ID
    if (!id) {
      return NextResponse.json({ error: "Food ID is required" }, { status: 400 });
    }

    // Find the food item and ensure it belongs to the user
    const existingFood = await Food.findOne({
      _id: id,
      userId: userId,
    });

    if (!existingFood) {
      return NextResponse.json({ error: "Food not found" }, { status: 404 });
    }

    // Update the food item
    const updatedFood = await Food.findByIdAndUpdate(
      id,
      {
        name: body.name,
        description: body.description,
        date: body.date,
        time: body.time,
        food_items: body.food_items,
        total_calories: body.total_calories,
        total_protein: body.total_protein,
        total_carbs: body.total_carbs,
        total_fat: body.total_fat,
        estimated_portion_size: body.estimated_portion_size,
      },
      { new: true }
    );

    return NextResponse.json(updatedFood);
  } catch (error: unknown) {
    console.error("Error updating food:", error);
    return NextResponse.json(
      { error: "Failed to update food" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = (session.user as unknown as { id: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { id } = await params;

    // Validate the food ID
    if (!id) {
      return NextResponse.json({ error: "Food ID is required" }, { status: 400 });
    }

    // Find the food item and ensure it belongs to the user
    const existingFood = await Food.findOne({
      _id: id,
      userId: userId,
    });

    if (!existingFood) {
      return NextResponse.json({ error: "Food not found" }, { status: 404 });
    }

    // Delete the food item
    await Food.findByIdAndDelete(id);

    return NextResponse.json({ message: "Food deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting food:", error);
    return NextResponse.json(
      { error: "Failed to delete food" },
      { status: 500 }
    );
  }
} 