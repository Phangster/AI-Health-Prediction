import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }
    await dbConnect();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(password, 10);
    await User.create({ name, email, password: hashed });
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 