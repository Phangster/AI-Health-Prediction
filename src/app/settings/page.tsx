"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  User,
  Settings as SettingsIcon
} from "lucide-react";
import { toast } from "sonner";

interface WeightGoal {
  _id?: string;
  userId: string;
  goalType: 'lose' | 'gain' | 'maintain';
  targetWeight: number;
  currentWeight: number;
  startDate: string;
  targetDate: string;
  weeklyGoal: number; // pounds per week
  createdAt: Date;
  updatedAt: Date;
}

interface Food {
  _id: string;
  name: string;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  createdAt: string;
}

interface ProgressData {
  daysTracked: number;
  totalCalories: number;
  averageCalories: number;
  caloriesDeficit: number; // for weight loss
  caloriesSurplus: number; // for weight gain
  estimatedWeightChange: number;
  onTrack: boolean;
  progressPercentage: number;
}

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const [foods, setFoods] = useState<Food[]>([]);
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [goalType, setGoalType] = useState<'lose' | 'gain' | 'maintain'>('lose');
  const [currentWeight, setCurrentWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [weeklyGoal, setWeeklyGoal] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch data when session is available
  useEffect(() => {
    if (session) {
      fetchWeightGoal();
      fetchFoods();
    }
  }, [session]);

  // Calculate progress when data changes
  useEffect(() => {
    if (weightGoal && foods.length > 0) {
      calculateProgress();
    }
  }, [weightGoal, foods]);

  const fetchWeightGoal = async () => {
    try {
      const res = await fetch("/api/settings/weight-goal");
      if (res.ok) {
        const data = await res.json();
        if (data.weightGoal) {
          setWeightGoal(data.weightGoal);
          setGoalType(data.weightGoal.goalType);
          setCurrentWeight(data.weightGoal.currentWeight.toString());
          setTargetWeight(data.weightGoal.targetWeight.toString());
          setTargetDate(data.weightGoal.targetDate);
          setWeeklyGoal(data.weightGoal.weeklyGoal.toString());
        }
      }
    } catch (e) {
      console.error("Failed to fetch weight goal:", e);
    }
  };

  const fetchFoods = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/foods");
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
      } else {
        setError("Failed to load food data");
      }
    } catch (e) {
      setError("Failed to load food data");
    }
    setLoading(false);
  };

  const calculateProgress = () => {
    if (!weightGoal) return;

    const startDate = new Date(weightGoal.startDate);
    const today = new Date();
    const daysElapsed = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Calculate total calories from tracked foods
    const totalCalories = foods.reduce((sum, food) => sum + food.total_calories, 0);
    const averageCalories = foods.length > 0 ? totalCalories / foods.length : 0;

    // Calculate expected weight change based on goal
    let estimatedWeightChange = 0;
    let caloriesDeficit = 0;
    let caloriesSurplus = 0;

    if (weightGoal.goalType === 'lose') {
      // For weight loss: 3500 calories = 1 pound
      const expectedCaloriesPerDay = 2000; // Base maintenance calories
      const actualCaloriesPerDay = averageCalories;
      caloriesDeficit = (expectedCaloriesPerDay - actualCaloriesPerDay) * daysElapsed;
      estimatedWeightChange = caloriesDeficit / 3500;
    } else if (weightGoal.goalType === 'gain') {
      // For weight gain: 3500 calories = 1 pound
      const expectedCaloriesPerDay = 2500; // Surplus calories
      const actualCaloriesPerDay = averageCalories;
      caloriesSurplus = (actualCaloriesPerDay - expectedCaloriesPerDay) * daysElapsed;
      estimatedWeightChange = caloriesSurplus / 3500;
    }

    // Calculate if on track
    const expectedWeightChange = weightGoal.weeklyGoal * (daysElapsed / 7);
    const onTrack = Math.abs(estimatedWeightChange - expectedWeightChange) <= 1; // Within 1 pound

    // Calculate progress percentage
    const totalWeightToChange = Math.abs(weightGoal.targetWeight - weightGoal.currentWeight);
    const progressPercentage = Math.min(100, Math.max(0, (Math.abs(estimatedWeightChange) / totalWeightToChange) * 100));

    setProgressData({
      daysTracked: daysElapsed,
      totalCalories,
      averageCalories,
      caloriesDeficit,
      caloriesSurplus,
      estimatedWeightChange,
      onTrack,
      progressPercentage
    });
  };

  const handleSaveGoal = async () => {
    if (!currentWeight || !targetWeight || !targetDate || !weeklyGoal) {
      toast.error("Please fill in all fields");
      return;
    }

    setSaving(true);
    try {
      const goalData = {
        goalType,
        currentWeight: parseFloat(currentWeight),
        targetWeight: parseFloat(targetWeight),
        targetDate,
        weeklyGoal: parseFloat(weeklyGoal),
        startDate: new Date().toISOString().split('T')[0]
      };

      const res = await fetch("/api/settings/weight-goal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(goalData),
      });

      if (res.ok) {
        const data = await res.json();
        setWeightGoal(data.weightGoal);
        toast.success("Weight goal saved successfully!");
      } else {
        toast.error("Failed to save weight goal");
      }
    } catch (e) {
      toast.error("Failed to save weight goal");
    }
    setSaving(false);
  };

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'lose': return <TrendingDown className="h-4 w-4" />;
      case 'gain': return <TrendingUp className="h-4 w-4" />;
      case 'maintain': return <Scale className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getGoalColor = (type: string) => {
    switch (type) {
      case 'lose': return 'text-red-600 bg-red-100';
      case 'gain': return 'text-green-600 bg-green-100';
      case 'maintain': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
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
          <span>Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your weight goals and track your progress
        </p>
      </div>

      <Tabs defaultValue="weight-goal" className="space-y-6">
        <TabsList>
          <TabsTrigger value="weight-goal">Weight Goals</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
        </TabsList>

        <TabsContent value="weight-goal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Weight Goal Settings
              </CardTitle>
              <CardDescription>
                Set your weight loss, gain, or maintenance goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Goal Type Selection */}
              <div className="space-y-4">
                <Label>Goal Type</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: 'lose', label: 'Lose Weight', icon: TrendingDown },
                    { value: 'gain', label: 'Gain Weight', icon: TrendingUp },
                    { value: 'maintain', label: 'Maintain', icon: Scale }
                  ].map((goal) => (
                    <div
                      key={goal.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        goalType === goal.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setGoalType(goal.value as any)}
                    >
                      <div className="flex items-center gap-2">
                        <goal.icon className="h-4 w-4" />
                        <span className="font-medium">{goal.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weight Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currentWeight">Current Weight (lbs)</Label>
                  <Input
                    id="currentWeight"
                    type="number"
                    value={currentWeight}
                    onChange={(e) => setCurrentWeight(e.target.value)}
                    placeholder="150"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetWeight">Target Weight (lbs)</Label>
                  <Input
                    id="targetWeight"
                    type="number"
                    value={targetWeight}
                    onChange={(e) => setTargetWeight(e.target.value)}
                    placeholder="140"
                  />
                </div>
              </div>

              {/* Date and Weekly Goal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="targetDate">Target Date</Label>
                  <Input
                    id="targetDate"
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weeklyGoal">Weekly Goal (lbs)</Label>
                  <Input
                    id="weeklyGoal"
                    type="number"
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(e.target.value)}
                    placeholder="1.0"
                    step="0.1"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveGoal} 
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Save Weight Goal
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {weightGoal ? (
            <div className="space-y-6">
              {/* Current Goal Display */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getGoalIcon(weightGoal.goalType)}
                    Current Goal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge className={`${getGoalColor(weightGoal.goalType)} capitalize`}>
                        {weightGoal.goalType} weight
                      </Badge>
                      <p className="text-sm text-muted-foreground mt-1">
                        {weightGoal.currentWeight} lbs → {weightGoal.targetWeight} lbs
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Weekly Goal</p>
                      <p className="font-semibold">{weightGoal.weeklyGoal} lbs/week</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Progress Tracking */}
              {progressData && (
                <Card>
                  <CardHeader>
                    <CardTitle>Progress Tracking</CardTitle>
                    <CardDescription>
                      Based on your diet data from the last {progressData.daysTracked} days
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Progress Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {Math.abs(progressData.estimatedWeightChange).toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">lbs {weightGoal.goalType === 'lose' ? 'lost' : 'gained'}</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          {Math.round(progressData.averageCalories)}
                        </div>
                        <div className="text-sm text-muted-foreground">avg calories/day</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round(progressData.progressPercentage)}%
                        </div>
                        <div className="text-sm text-muted-foreground">progress</div>
                      </div>
                    </div>

                    {/* On Track Status */}
                    <div className={`p-4 rounded-lg border ${
                      progressData.onTrack 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {progressData.onTrack ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        )}
                        <div>
                          <h4 className="font-semibold">
                            {progressData.onTrack ? 'On Track!' : 'Needs Adjustment'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {progressData.onTrack 
                              ? 'Your current diet is aligned with your weight goal.'
                              : 'Consider adjusting your calorie intake to meet your goal.'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Detailed Analysis */}
                    <div className="space-y-4">
                      <h4 className="font-semibold">Detailed Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Days tracked:</span>
                          <span className="font-medium">{progressData.daysTracked}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total calories consumed:</span>
                          <span className="font-medium">{Math.round(progressData.totalCalories)}</span>
                        </div>
                        {weightGoal.goalType === 'lose' && (
                          <div className="flex justify-between">
                            <span>Calorie deficit:</span>
                            <span className="font-medium">{Math.round(progressData.caloriesDeficit)}</span>
                          </div>
                        )}
                        {weightGoal.goalType === 'gain' && (
                          <div className="flex justify-between">
                            <span>Calorie surplus:</span>
                            <span className="font-medium">{Math.round(progressData.caloriesSurplus)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Weight Goal Set</h3>
                <p className="text-muted-foreground mb-4">
                  Set a weight goal to start tracking your progress against your diet.
                </p>
                <Button onClick={() => document.querySelector('[data-value="weight-goal"]')?.click()}>
                  Set Weight Goal
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 