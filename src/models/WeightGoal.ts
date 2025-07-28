import mongoose, { Schema, Document } from "mongoose";

export interface WeightGoal extends Document {
  userId: mongoose.Types.ObjectId;
  goalType: 'lose' | 'gain' | 'maintain';
  targetWeight: number;
  currentWeight: number;
  startDate: string;
  targetDate: string;
  weeklyGoal: number;
  createdAt: Date;
  updatedAt: Date;
}

const WeightGoalSchema = new Schema<WeightGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    goalType: {
      type: String,
      required: true,
      enum: ["lose", "gain", "maintain"],
    },
    targetWeight: {
      type: Number,
      required: true,
    },
    currentWeight: {
      type: Number,
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    targetDate: {
      type: String,
      required: true,
    },
    weeklyGoal: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.WeightGoal || mongoose.model<WeightGoal>("WeightGoal", WeightGoalSchema); 