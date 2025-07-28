import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Convert file to base64 for OpenAI API
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    try {
      // Analyze the food image using GPT-4.1-nano
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini", // Using GPT-4o-mini as it's the latest and most cost-effective
        messages: [
          {
            role: "system",
            content: `You are a nutrition expert. Analyze the food image and provide detailed nutrition information. 
            Return a JSON object with the following structure:
            {
              "food_items": [
                {
                  "name": "food name",
                  "calories": number,
                  "protein": number,
                  "carbs": number,
                  "fat": number,
                  "fiber": number,
                  "sugar": number,
                  "sodium": number
                }
              ],
              "total_calories": number,
              "total_protein": number,
              "total_carbs": number,
              "total_fat": number,
              "total_fiber": number,
              "total_sugar": number,
              "total_sodium": number,
              "meal_type": "breakfast|lunch|dinner|snack",
              "estimated_portion_size": "small|medium|large"
            }
            
            Provide realistic nutrition values for the food items shown. Be accurate and conservative in estimates.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this food image and provide nutrition information in the specified JSON format."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${file.type};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3, // Lower temperature for more consistent results
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      // Parse the JSON response
      let nutritionData;
      try {
        // Extract JSON from the response (it might be wrapped in markdown)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          nutritionData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in response");
        }
      } catch {
        console.error("Failed to parse OpenAI response:", content);
        throw new Error("Invalid nutrition data format");
      }

      // Validate the nutrition data structure
      if (!nutritionData.food_items || !Array.isArray(nutritionData.food_items)) {
        throw new Error("Invalid nutrition data structure");
      }

      return NextResponse.json({
        success: true,
        extracted: nutritionData,
      });

    } catch (openaiError: unknown) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json(
        { error: "Failed to analyze food image with AI" },
        { status: 500 }
      );
    }

  } catch (error: unknown) {
    console.error("Food analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze food image" },
      { status: 500 }
    );
  }
} 