import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";
import dbConnect from "@/lib/mongodb";
import HealthPrediction from "@/models/HealthPrediction";
import User from "@/models/User";

interface Food {
  _id: string;
  name: string;
  description: string;
  date: string;
  time?: string;
  food_items: Array<{
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  }>;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  total_sugar: number;
  total_sodium: number;
  meal_type: string;
  estimated_portion_size: string;
  createdAt: string;
}

interface HealthPrediction {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  riskFactors: string[];
  recommendations: string[];
  predictedTrajectory: string;
  timeframe: string;
  confidence: number;
}

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

    // Get the latest prediction for the user
    const latestPrediction = await HealthPrediction.findOne({ 
      userId: user._id 
    }).sort({ createdAt: -1 });

    if (!latestPrediction) {
      return NextResponse.json({ prediction: null });
    }

    return NextResponse.json({ prediction: latestPrediction });
      } catch (error: unknown) {
      console.error("Get health prediction error:", error);
      return NextResponse.json(
        { error: "Failed to retrieve health prediction" },
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

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Get user's food data
    const foodsResponse = await fetch(`${req.nextUrl.origin}/api/foods`, {
      headers: {
        'Cookie': req.headers.get('cookie') || '',
      },
    });

    if (!foodsResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch food data" }, { status: 500 });
    }

    const foods: Food[] = await foodsResponse.json();

    if (foods.length === 0) {
      return NextResponse.json({
        prediction: {
          overallHealth: 'fair',
          riskFactors: ['Insufficient data for analysis'],
          recommendations: ['Start tracking your meals regularly to get personalized health insights'],
          predictedTrajectory: 'Unable to predict trajectory without sufficient data',
          timeframe: '3-6 months',
          confidence: 0
        }
      });
    }

    // Calculate nutrition averages
    const totalDays = new Set(foods.map(f => f.date)).size;
    const avgCalories = foods.reduce((sum, f) => sum + f.total_calories, 0) / totalDays;
    const avgCarbs = foods.reduce((sum, f) => sum + f.total_carbs, 0) / totalDays;
    const avgProtein = foods.reduce((sum, f) => sum + f.total_protein, 0) / totalDays;
    const avgFat = foods.reduce((sum, f) => sum + f.total_fat, 0) / totalDays;
    const avgSugar = foods.reduce((sum, f) => sum + f.total_sugar, 0) / totalDays;
    const avgSodium = foods.reduce((sum, f) => sum + f.total_sodium, 0) / totalDays;

    // Create nutrition summary
    const nutritionSummary = {
      totalMeals: foods.length,
      daysTracked: totalDays,
      averageDailyCalories: Math.round(avgCalories),
      averageDailyCarbs: Math.round(avgCarbs),
      averageDailyProtein: Math.round(avgProtein),
      averageDailyFat: Math.round(avgFat),
      averageDailySugar: Math.round(avgSugar),
      averageDailySodium: Math.round(avgSodium),
      mealTypes: foods.reduce((acc, f) => {
        acc[f.meal_type] = (acc[f.meal_type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      recentFoods: foods.slice(-10).map(f => ({
        name: f.name,
        calories: f.total_calories,
        carbs: f.total_carbs,
        protein: f.total_protein,
        fat: f.total_fat,
        mealType: f.meal_type
      }))
    };

    try {
      // Analyze diet patterns and predict health trajectory using GPT-4
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a nutritionist and health expert. Analyze the provided diet data and predict the user's health trajectory. 
            
            Return a JSON object with the following structure:
            {
              "overallHealth": "excellent|good|fair|poor",
              "riskFactors": ["array of specific risk factors"],
              "recommendations": ["array of actionable recommendations"],
              "predictedTrajectory": "detailed prediction of health trajectory",
              "timeframe": "prediction timeframe (e.g., 3-6 months, 1 year)",
              "confidence": number (0-100)
            }
            
            Consider:
            - Calorie balance and macronutrient ratios
            - Sugar and sodium intake
            - Meal timing and variety
            - Long-term health implications
            - Specific actionable recommendations`
          },
          {
            role: "user",
            content: `Analyze this nutrition data and predict health trajectory:
            
            ${JSON.stringify(nutritionSummary, null, 2)}
            
            Provide a comprehensive health analysis and prediction.`
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      // Parse the JSON response
      let prediction: HealthPrediction;
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          prediction = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch {
        console.error("Failed to parse OpenAI response:", content);
        throw new Error("Invalid prediction data format");
      }

      // Save prediction to database
      await dbConnect();
      
      // Get user ID from email
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Save or update the prediction
      const savedPrediction = await HealthPrediction.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          overallHealth: prediction.overallHealth,
          riskFactors: prediction.riskFactors,
          recommendations: prediction.recommendations,
          predictedTrajectory: prediction.predictedTrajectory,
          timeframe: prediction.timeframe,
          confidence: prediction.confidence,
          nutritionSummary: nutritionSummary,
        },
        { upsert: true, new: true }
      );

      return NextResponse.json({
        prediction: savedPrediction
      });

    } catch (openaiError: unknown) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json(
        { error: "Failed to generate health prediction" },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error("Health prediction error:", error);
    return NextResponse.json(
      { error: "Failed to generate health prediction" },
      { status: 500 }
    );
  }
} 