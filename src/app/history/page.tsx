"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Package, RefreshCw, ChevronDown, ChevronRight, Clock } from "lucide-react";
import { FoodAnalysisDialog } from "@/components/FoodAnalysisDialog";
import { toast } from "sonner";

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

interface NutritionData {
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

}

interface GroupedFoods {
  date: string;
  foods: Food[];
  isExpanded: boolean;
}



export default function HistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupedFoods, setGroupedFoods] = useState<GroupedFoods[]>([]);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch foods when session is available
  useEffect(() => {
    if (session) {
      fetchFoods();
    }
  }, [session]);

  // Group foods by date whenever foods change
  useEffect(() => {
    if (foods.length > 0) {
      const grouped = groupFoodsByDate(foods);
      setGroupedFoods(grouped);
    } else {
      setGroupedFoods([]);
    }
  }, [foods]);

  const fetchFoods = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/foods");
      if (res.ok) {
        const data = await res.json();
        setFoods(data);
      } else {
        setError("Failed to load foods");
      }
    } catch {
      setError("Failed to load foods");
    }
    setLoading(false);
  };



  const groupFoodsByDate = (foods: Food[]): GroupedFoods[] => {
    const grouped = foods.reduce((acc, food) => {
      const date = new Date(food.date).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(food);
      return acc;
    }, {} as Record<string, Food[]>);

    return Object.entries(grouped)
      .map(([date, foods]) => ({
        date,
        foods: foods.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        isExpanded: false
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const toggleGroup = (date: string) => {
    setGroupedFoods(prev => 
      prev.map(group => 
        group.date === date 
          ? { ...group, isExpanded: !group.isExpanded }
          : group
      )
    );
  };



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "N/A";
    return timeString;
  };





  const navigateToCalendar = () => {
    router.push("/calendar");
  };

  const transformFoodToNutritionData = (food: Food): NutritionData => {
    const nutritionData = {
      food_items: food.food_items,
      total_calories: food.total_calories,
      total_protein: food.total_protein,
      total_carbs: food.total_carbs,
      total_fat: food.total_fat,
      total_fiber: food.total_fiber,
      total_sugar: food.total_sugar,
      total_sodium: food.total_sodium,
      meal_type: food.meal_type,
      estimated_portion_size: food.estimated_portion_size,

    };
    
    console.log("🔄 Transform Debug:", {
      originalFood: food,
      transformedData: nutritionData
    });
    
    return nutritionData;
  };

  const transformNutritionDataToFood = (nutritionData: NutritionData, originalFood: Food, formData: { name: string; description: string; date: string; time: string }): Food => {
    return {
      ...originalFood,
      name: formData.name,
      description: formData.description,
      date: formData.date,
      time: formData.time,
      food_items: nutritionData.food_items,
      total_calories: nutritionData.total_calories,
      total_protein: nutritionData.total_protein,
      total_carbs: nutritionData.total_carbs,
      total_fat: nutritionData.total_fat,
      total_fiber: nutritionData.total_fiber,
      total_sugar: nutritionData.total_sugar,
      total_sodium: nutritionData.total_sodium,
      meal_type: nutritionData.meal_type,
      estimated_portion_size: nutritionData.estimated_portion_size,

    };
  };

  const handleFoodClick = (food: Food) => {
    setSelectedFood(food);
    setIsModalOpen(true);
  };

  const handleFoodSave = async (data: {
    name: string;
    description: string;
    date: string;
    time: string;
    nutritionData: NutritionData;
  }) => {
    if (!selectedFood) return;

    const updatedFood = transformNutritionDataToFood(data.nutritionData, selectedFood, {
      name: data.name,
      description: data.description,
      date: data.date,
      time: data.time
    });
    
    try {
      const response = await fetch(`/api/foods/${selectedFood._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFood),
      });

      if (response.ok) {
        // Update the food in the local state
        setFoods(prev => prev.map(food => 
          food._id === selectedFood._id ? updatedFood : food
        ));
        setSelectedFood(updatedFood);
        setIsModalOpen(false);
        toast.success("Food analysis updated successfully!");
      } else {
        throw new Error('Failed to update food analysis');
      }
    } catch (error) {
      console.error('Error updating food analysis:', error);
      toast.error("Failed to update food analysis. Please try again.");
    }
  };

  // Don't render anything while checking authentication
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (status === "unauthenticated") {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading foods...</span>
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Food Analysis History</h1>
          <p className="text-muted-foreground">
            View and manage your saved food analyses
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={navigateToCalendar} variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Calendar View
          </Button>
          <Button onClick={fetchFoods} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {foods.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No food analyses yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start by analyzing your first food photo to see it here.
            </p>
            <Button asChild>
              <a href="/dashboard">Analyze Food</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Food Analysis Summary</CardTitle>
            <CardDescription>
              {foods.length} total food analyses across {groupedFoods.length} days
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead className="font-medium">Name</TableHead>
                  <TableHead className="font-medium">Description</TableHead>
                  <TableHead className="font-medium">Meal Type</TableHead>
                  <TableHead className="font-medium">Portion Size</TableHead>
                  <TableHead className="font-medium">Nutrition</TableHead>
                  <TableHead className="font-medium">Date</TableHead>
                  <TableHead className="font-medium">Time</TableHead>
                  <TableHead className="text-right font-medium">Calories</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupedFoods.map((group) => (
                  <React.Fragment key={group.date}>
                    {/* Group Header Row */}
                    <TableRow 
                      className="bg-muted/50 hover:bg-muted/70 cursor-pointer"
                      onClick={() => toggleGroup(group.date)}
                    >
                      <TableCell>
                        {group.isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium" colSpan={7}>
                        {formatDate(group.date)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-muted-foreground">
                        {group.foods.reduce((sum, food) => sum + food.total_calories, 0)} cal
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Food Rows */}
                    {group.isExpanded && group.foods.map((food) => (
                      <TableRow 
                        key={food._id} 
                        className="bg-background hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleFoodClick(food)}
                      >
                        <TableCell></TableCell>
                        <TableCell className="font-medium">{food.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {food.description || "No description"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="capitalize">
                              {food.meal_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm capitalize">
                            {food.estimated_portion_size}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs space-y-1">
                            <div className="flex justify-between">
                              <span className="text-blue-600">P:</span>
                              <span>{food.total_protein}g</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-orange-600">C:</span>
                              <span>{food.total_carbs}g</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-red-600">F:</span>
                              <span>{food.total_fat}g</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(food.date)}</TableCell>
                        <TableCell>
                          {food.time ? (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime(food.time)}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-medium">{food.total_calories} cal</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Food Analysis Edit Dialog */}
      {selectedFood && (
        <FoodAnalysisDialog
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          nutritionData={transformFoodToNutritionData(selectedFood)}
          onConfirm={handleFoodSave}
          isLoading={false}
          originalName={selectedFood.name}
          originalDescription={selectedFood.description}
        />
      )}
    </div>
  );
} 