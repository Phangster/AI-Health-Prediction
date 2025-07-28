"use client";
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, Utensils, Calendar, Clock } from "lucide-react";

interface FoodItem {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
}

interface NutritionData {
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
}

interface FoodAnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nutritionData: NutritionData;
  onConfirm: (data: {
    name: string;
    description: string;
    date: string;
    time: string;
    nutritionData: NutritionData;
  }) => void;
  isLoading?: boolean;
  originalName?: string;
  originalDescription?: string;
}



export function FoodAnalysisDialog({
  isOpen,
  onClose,
  nutritionData,
  onConfirm,
  isLoading = false,
  originalName,
  originalDescription,
}: FoodAnalysisDialogProps) {
  // Ensure nutritionData is not undefined
  const safeNutritionData = nutritionData || {
    food_items: [],
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fat: 0,
    total_fiber: 0,
    total_sugar: 0,
    total_sodium: 0,
    meal_type: "lunch",
    estimated_portion_size: "medium",
  };
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [editableData, setEditableData] = useState<NutritionData>(safeNutritionData);



  // Initialize form data when dialog opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toTimeString().slice(0, 5);
      
      setName(originalName || "");
      setDescription(originalDescription || "");
      setDate(today);
      setTime(currentTime);
      
      // Ensure nutritionData has all required fields with defaults
      const processedNutritionData = {
        food_items: safeNutritionData.food_items || [],
        total_calories: safeNutritionData.total_calories || 0,
        total_protein: safeNutritionData.total_protein || 0,
        total_carbs: safeNutritionData.total_carbs || 0,
        total_fat: safeNutritionData.total_fat || 0,
        total_fiber: safeNutritionData.total_fiber || 0,
        total_sugar: safeNutritionData.total_sugar || 0,
        total_sodium: safeNutritionData.total_sodium || 0,
        meal_type: safeNutritionData.meal_type || "lunch",
        estimated_portion_size: safeNutritionData.estimated_portion_size || "medium",
      };
      setEditableData(processedNutritionData);
    }
  }, [isOpen, nutritionData, originalName, originalDescription]);



  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      name,
      description,
      date,
      time,
      nutritionData: editableData,
    });
  };

  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return "0.0";
    return num.toFixed(1);
  };

  const isEditMode = !!originalName;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-6 border-b">
          <DialogTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            {isEditMode ? "Edit Food Analysis" : "Confirm Food Analysis"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Review and edit the nutrition information before updating."
              : "Review and edit the nutrition information before saving."
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Label htmlFor="name">Meal Name</Label>
            <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter meal name"
                className="border-2 focus:border-blue-500"
            />
            <Label htmlFor="description">Description</Label>
            <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={1}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Nutrition Summary */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Nutrition Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatNumber(editableData.total_calories)}
                  </div>
                  <div className="text-sm text-blue-600">Calories</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatNumber(editableData.total_protein)}g
                  </div>
                  <div className="text-sm text-green-600">Protein</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatNumber(editableData.total_carbs)}g
                  </div>
                  <div className="text-sm text-yellow-600">Carbs</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {formatNumber(editableData.total_fat)}g
                  </div>
                  <div className="text-sm text-red-600">Fat</div>
                </div>
              </div>
            </div>

            {/* Food Items */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Food Items</h3>
              <div className="space-y-3">
                {editableData.food_items?.map((item, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{item.name}</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>Calories: {item.calories}</div>
                      <div>Protein: {item.protein}g</div>
                      <div>Carbs: {item.carbs}g</div>
                      <div>Fat: {item.fat}g</div>
                    </div>
                  </div>
                ))}
                {(!editableData.food_items || editableData.food_items.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    No food items detected. Please try analyzing the image again.
                  </div>
                )}
              </div>
            </div>


          </form>
        </div>

        <DialogFooter className="flex-shrink-0 p-6 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? "Update Food Analysis" : "Save Food Analysis"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 