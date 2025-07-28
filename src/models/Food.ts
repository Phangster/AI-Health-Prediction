import mongoose, { Schema, Document } from "mongoose";

export interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

export interface Food extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  date: string;
  time?: string;
  food_items: FoodItem[];
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  total_sodium: number;
  meal_type: string;
  estimated_portion_size: string;
  tags: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const FoodItemSchema = new Schema<FoodItem>({
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fat: { type: Number, required: true },
  fiber: { type: Number, required: true },
  sugar: { type: Number, required: true },
  sodium: { type: Number, required: true },
});

const FoodSchema = new Schema<Food>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: String,
      required: true,
    },
    time: {
      type: String,
      default: "",
    },
    food_items: [FoodItemSchema],
    total_calories: {
      type: Number,
      required: true,
    },
    total_protein: {
      type: Number,
      required: true,
    },
    total_carbs: {
      type: Number,
      required: true,
    },
    total_fat: {
      type: Number,
      required: true,
    },
    total_fiber: {
      type: Number,
      required: true,
    },
    total_sugar: {
      type: Number,
      required: true,
    },
    total_sodium: {
      type: Number,
      required: true,
    },
    meal_type: {
      type: String,
      required: true,
      enum: ["breakfast", "lunch", "dinner", "snack"],
    },
    estimated_portion_size: {
      type: String,
      required: true,
      enum: ["small", "medium", "large"],
    },
    tags: [{
      type: Schema.Types.ObjectId,
      ref: "Tag",
    }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Food || mongoose.model<Food>("Food", FoodSchema); 