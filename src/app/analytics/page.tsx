"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown, 
  Apple, 
  Beef, 
  Wheat, 
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Brain,
  Activity
} from "lucide-react";

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

interface NutritionTrend {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface HealthInsight {
  type: 'positive' | 'warning' | 'negative';
  title: string;
  description: string;
  recommendation: string;
}

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nutritionTrends, setNutritionTrends] = useState<NutritionTrend[]>([]);
  const [healthInsights, setHealthInsights] = useState<HealthInsight[]>([]);
  const [healthPrediction, setHealthPrediction] = useState<{
    overallHealth: string;
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
  } | null>(null);
  const [predictionLoading, setPredictionLoading] = useState(false);
  const [lastPredictionDate, setLastPredictionDate] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Remove automatic health prediction trigger

  const fetchFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/foods");
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
        analyzeNutritionTrends(data);
        generateHealthInsights(data);
      } else {
        setError("Failed to load food data");
      }
    } catch {
      setError("Failed to load food data");
    }
    setLoading(false);
  }, []);

  const fetchLatestPrediction = useCallback(async () => {
    try {
      const res = await fetch("/api/health/predict", {
        method: "GET",
      });
      if (res.ok) {
        const data = await res.json();
        if (data.prediction) {
          setHealthPrediction(data.prediction);
          setLastPredictionDate(new Date(data.prediction.createdAt).toLocaleDateString());
        }
      } else {
        console.error("Failed to fetch latest prediction");
      }
    } catch {
      console.error("Failed to fetch latest prediction");
    }
  }, []);

  // Fetch foods and latest prediction when session is available
  useEffect(() => {
    if (session) {
      fetchFoods();
      fetchLatestPrediction();
    }
  }, [session, fetchFoods, fetchLatestPrediction]);

  const fetchHealthPrediction = async () => {
    setPredictionLoading(true);
    try {
      const res = await fetch("/api/health/predict", {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setHealthPrediction(data.prediction);
        setLastPredictionDate(new Date(data.prediction.createdAt).toLocaleDateString());
      } else {
        console.error("Failed to fetch health prediction");
      }
    } catch {
      console.error("Failed to fetch health prediction");
    }
    setPredictionLoading(false);
  };

  const analyzeNutritionTrends = (foodData: Food[]) => {
    // Group foods by date and calculate daily totals
    const dailyTotals = foodData.reduce((acc, food) => {
      const date = food.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
        };
      }
      
      acc[date].calories += food.total_calories;
      acc[date].protein += food.total_protein;
      acc[date].carbs += food.total_carbs;
      acc[date].fat += food.total_fat;
      acc[date].fiber += food.total_fiber;
      acc[date].sugar += food.total_sugar;
      acc[date].sodium += food.total_sodium;
      
      return acc;
    }, {} as Record<string, NutritionTrend>);

    // Convert to array and sort by date
    const trends = Object.values(dailyTotals).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    setNutritionTrends(trends);
  };

  const generateHealthInsights = (foodData: Food[]) => {
    const insights: HealthInsight[] = [];
    
    if (foodData.length === 0) {
      insights.push({
        type: 'warning',
        title: 'No Data Available',
        description: 'Start tracking your meals to get personalized insights.',
        recommendation: 'Upload your first food photo to begin tracking.'
      });
      setHealthInsights(insights);
      return;
    }

    // Calculate averages
    const totalDays = new Set(foodData.map(f => f.date)).size;
    const avgCalories = foodData.reduce((sum, f) => sum + f.total_calories, 0) / totalDays;
    const avgCarbs = foodData.reduce((sum, f) => sum + f.total_carbs, 0) / totalDays;
    const avgProtein = foodData.reduce((sum, f) => sum + f.total_protein, 0) / totalDays;
    const avgSugar = foodData.reduce((sum, f) => sum + f.total_sugar, 0) / totalDays;

    // Calorie insights
    if (avgCalories < 1200) {
      insights.push({
        type: 'warning',
        title: 'Low Calorie Intake',
        description: `Your average daily calorie intake is ${Math.round(avgCalories)} calories.`,
        recommendation: 'Consider increasing your calorie intake with nutrient-dense foods.'
      });
    } else if (avgCalories > 2500) {
      insights.push({
        type: 'warning',
        title: 'High Calorie Intake',
        description: `Your average daily calorie intake is ${Math.round(avgCalories)} calories.`,
        recommendation: 'Consider reducing portion sizes or choosing lower-calorie alternatives.'
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Balanced Calorie Intake',
        description: `Your average daily calorie intake is ${Math.round(avgCalories)} calories.`,
        recommendation: 'Great job maintaining a healthy calorie balance!'
      });
    }

    // Carb insights
    if (avgCarbs > 300) {
      insights.push({
        type: 'warning',
        title: 'High Carbohydrate Intake',
        description: `Your average daily carb intake is ${Math.round(avgCarbs)}g.`,
        recommendation: 'Consider reducing refined carbs and increasing protein and healthy fats.'
      });
    } else if (avgCarbs < 50) {
      insights.push({
        type: 'warning',
        title: 'Very Low Carbohydrate Intake',
        description: `Your average daily carb intake is ${Math.round(avgCarbs)}g.`,
        recommendation: 'Consider adding more complex carbohydrates for sustained energy.'
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Healthy Carbohydrate Balance',
        description: `Your average daily carb intake is ${Math.round(avgCarbs)}g.`,
        recommendation: 'Excellent balance of carbohydrates in your diet!'
      });
    }

    // Protein insights
    if (avgProtein < 50) {
      insights.push({
        type: 'warning',
        title: 'Low Protein Intake',
        description: `Your average daily protein intake is ${Math.round(avgProtein)}g.`,
        recommendation: 'Increase protein intake with lean meats, fish, eggs, or plant-based sources.'
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Adequate Protein Intake',
        description: `Your average daily protein intake is ${Math.round(avgProtein)}g.`,
        recommendation: 'Great job meeting your protein needs!'
      });
    }

    // Sugar insights
    if (avgSugar > 50) {
      insights.push({
        type: 'negative',
        title: 'High Sugar Intake',
        description: `Your average daily sugar intake is ${Math.round(avgSugar)}g.`,
        recommendation: 'Reduce added sugars and focus on whole foods.'
      });
    } else {
      insights.push({
        type: 'positive',
        title: 'Low Sugar Intake',
        description: `Your average daily sugar intake is ${Math.round(avgSugar)}g.`,
        recommendation: 'Excellent! You\'re keeping your sugar intake in check.'
      });
    }

    setHealthInsights(insights);
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <BarChart3 className="h-4 w-4 text-gray-600" />;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'negative': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'positive': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'negative': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 animate-spin" />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchFoods}>Try Again</Button>
      </div>
    );
  }

  const recentTrends = nutritionTrends.slice(-7); // Last 7 days
  const avgCalories = foods.length > 0 ? foods.reduce((sum, f) => sum + f.total_calories, 0) / foods.length : 0;
  const avgCarbs = foods.length > 0 ? foods.reduce((sum, f) => sum + f.total_carbs, 0) / foods.length : 0;
  const avgProtein = foods.length > 0 ? foods.reduce((sum, f) => sum + f.total_protein, 0) / foods.length : 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Diet Analytics</h1>
        <p className="text-muted-foreground">
          Track your nutrition trends and get personalized health insights
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Nutrition Trends</TabsTrigger>
          <TabsTrigger value="insights">Health Insights</TabsTrigger>
          <TabsTrigger value="prediction">Health Prediction</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meals</CardTitle>
                <Apple className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{foods.length}</div>
                <p className="text-xs text-muted-foreground">
                  {new Set(foods.map(f => f.date)).size} days tracked
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Calories</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(avgCalories)}</div>
                <p className="text-xs text-muted-foreground">
                  per meal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Carbs</CardTitle>
                <Wheat className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(avgCarbs)}g</div>
                <p className="text-xs text-muted-foreground">
                  per meal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Protein</CardTitle>
                <Beef className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{Math.round(avgProtein)}g</div>
                <p className="text-xs text-muted-foreground">
                  per meal
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Nutrition Trends</CardTitle>
              <CardDescription>Your nutrition data over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTrends.map((trend) => (
                  <div key={trend.date} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{new Date(trend.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Calories</div>
                        <div className="font-semibold">{Math.round(trend.calories)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Carbs</div>
                        <div className="font-semibold">{Math.round(trend.carbs)}g</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Protein</div>
                        <div className="font-semibold">{Math.round(trend.protein)}g</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Fat</div>
                        <div className="font-semibold">{Math.round(trend.fat)}g</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Trends Analysis</CardTitle>
              <CardDescription>Track your macronutrient balance over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {nutritionTrends.length > 1 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Calorie Trends</h3>
                      {nutritionTrends.slice(-5).map((trend, index) => {
                        const prev = index > 0 ? nutritionTrends[nutritionTrends.length - 6 + index] : null;
                        return (
                          <div key={trend.date} className="flex items-center justify-between p-3 border rounded">
                            <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{Math.round(trend.calories)} cal</span>
                              {prev && getTrendIcon(trend.calories, prev.calories)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="font-semibold">Carbohydrate Trends</h3>
                      {nutritionTrends.slice(-5).map((trend, index) => {
                        const prev = index > 0 ? nutritionTrends[nutritionTrends.length - 6 + index] : null;
                        return (
                          <div key={trend.date} className="flex items-center justify-between p-3 border rounded">
                            <span className="text-sm">{new Date(trend.date).toLocaleDateString()}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{Math.round(trend.carbs)}g</span>
                              {prev && getTrendIcon(trend.carbs, prev.carbs)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Health Insights & Recommendations</CardTitle>
              <CardDescription>Personalized analysis of your diet patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {healthInsights.map((insight, index) => (
                  <div key={index} className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}>
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <p className="text-sm font-medium">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prediction" className="space-y-6">
          <Card>
                          <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      AI Health Trajectory Prediction
                    </CardTitle>
                                    <CardDescription>
                  AI-powered analysis of your diet patterns and predicted health outcomes
                  {lastPredictionDate && (
                    <span className="block text-xs text-muted-foreground mt-1">
                      Last analyzed: {lastPredictionDate}
                    </span>
                  )}
                </CardDescription>
                  </div>
                  {healthPrediction && (
                    <Button 
                      onClick={fetchHealthPrediction} 
                      disabled={predictionLoading}
                      variant="outline" 
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      {predictionLoading ? (
                        <>
                          <Clock className="h-4 w-4 animate-spin" />
                          Refreshing...
                        </>
                      ) : (
                        <>
                          <Brain className="h-4 w-4" />
                          Refresh Analysis
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardHeader>
            <CardContent>
              {predictionLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 animate-spin" />
                    <span>Analyzing your diet patterns...</span>
                  </div>
                </div>
              ) : healthPrediction ? (
                <div className="space-y-6">
                  {/* Overall Health Score */}
                  <div className="flex items-center gap-4 p-4 border rounded-lg">
                    <Activity className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-semibold">Overall Health Assessment</h3>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={
                            healthPrediction.overallHealth === 'excellent' ? 'default' :
                            healthPrediction.overallHealth === 'good' ? 'secondary' :
                            healthPrediction.overallHealth === 'fair' ? 'outline' : 'destructive'
                          }
                          className="capitalize"
                        >
                          {healthPrediction.overallHealth}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Confidence: {healthPrediction.confidence}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Risk Factors</h3>
                    <div className="space-y-2">
                      {healthPrediction.riskFactors.map((risk: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                          <span className="text-sm">{risk}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Recommendations</h3>
                    <div className="space-y-2">
                      {healthPrediction.recommendations.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Predicted Trajectory */}
                  <div className="space-y-4">
                    <h3 className="font-semibold">Predicted Health Trajectory</h3>
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm mb-2">
                        <span className="font-medium">Timeframe:</span> {healthPrediction.timeframe}
                      </p>
                      <p className="text-sm">{healthPrediction.predictedTrajectory}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Get AI-powered health insights based on your diet patterns.
                  </p>
                  <Button 
                    onClick={fetchHealthPrediction} 
                    disabled={predictionLoading || foods.length === 0}
                    className="flex items-center gap-2"
                  >
                    {predictionLoading ? (
                      <>
                        <Clock className="h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4" />
                        Generate Health Prediction
                      </>
                    )}
                  </Button>
                  {foods.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Start tracking your meals to get personalized insights.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 