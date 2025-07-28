import mongoose, { Schema, Document } from "mongoose";

export interface HealthPrediction extends Document {
  userId: mongoose.Types.ObjectId;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  riskFactors: string[];
  recommendations: string[];
  predictedTrajectory: string;
  timeframe: string;
  confidence: number;
  nutritionSummary: {
    totalMeals: number;
    daysTracked: number;
    averageDailyCalories: number;
    averageDailyCarbs: number;
    averageDailyProtein: number;
    averageDailyFat: number;
    averageDailySugar: number;
    averageDailySodium: number;
    mealTypes: Record<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const HealthPredictionSchema = new Schema<HealthPrediction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    overallHealth: {
      type: String,
      required: true,
      enum: ["excellent", "good", "fair", "poor"],
    },
    riskFactors: [{
      type: String,
      required: true,
    }],
    recommendations: [{
      type: String,
      required: true,
    }],
    predictedTrajectory: {
      type: String,
      required: true,
    },
    timeframe: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    nutritionSummary: {
      totalMeals: { type: Number, required: true },
      daysTracked: { type: Number, required: true },
      averageDailyCalories: { type: Number, required: true },
      averageDailyCarbs: { type: Number, required: true },
      averageDailyProtein: { type: Number, required: true },
      averageDailyFat: { type: Number, required: true },
      averageDailySugar: { type: Number, required: true },
      averageDailySodium: { type: Number, required: true },
      mealTypes: { type: Schema.Types.Mixed, required: true },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.HealthPrediction || mongoose.model<HealthPrediction>("HealthPrediction", HealthPredictionSchema); 