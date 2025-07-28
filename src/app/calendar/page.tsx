"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, Package, RefreshCw, ChevronLeft, ChevronRight, Clock } from "lucide-react";

interface Food {
  _id: string;
  name: string;
  description: string;
  date: string;
  time?: string;
  food_items: Array<{
    name: string;
    quantity: number;
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

export default function CalendarPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<{ [key: string]: boolean }>({});

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



  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return "";
    return timeString;
  };

  const toggleItems = (receiptId: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [receiptId]: !prev[receiptId]
    }));
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getFoodsForDate = (date: Date) => {
    return foods.filter(food => {
      const foodDate = new Date(food.date);
      return foodDate.toDateString() === date.toDateString();
    });
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDayOfMonth = getFirstDayOfMonth(currentDate);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      days.push(date);
    }

    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
          <span>Loading receipts...</span>
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

  const calendarDays = generateCalendarDays();
  const selectedDateFoods = selectedDate ? getFoodsForDate(selectedDate) : [];

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Food Analysis Calendar</h1>
          <p className="text-muted-foreground">
            View your food analyses in a calendar format
          </p>
        </div>
        <Button onClick={fetchFoods} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
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
        <div className="space-y-6">
          {/* Calendar Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('prev')}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold">{getMonthName(currentDate)}</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateMonth('next')}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 bg-gray-50 rounded-lg p-4">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
                {day}
              </div>
            ))}

            {/* Calendar days */}
            {calendarDays.map((date, index) => {
              if (!date) {
                return <div key={index} className="p-2 min-h-[100px]" />;
              }

              const dayFoods = getFoodsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();

              return (
                <div
                  key={index}
                  className={`p-2 min-h-[100px] border cursor-pointer transition-all duration-200 ${
                    isToday 
                      ? 'bg-gray-300' 
                      : isSelected 
                        ? 'ring-2 ring-blue-600 border-blue-400 bg-blue-100 shadow-md' 
                        : 'border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setSelectedDate(date);
                    setIsDialogOpen(true);
                  }}
                >
                  <div className="text-sm font-medium mb-1">
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayFoods.slice(0, 2).map((food) => (
                      <div
                        key={food._id}
                        className="text-xs p-1 bg-green-100 text-green-800 rounded truncate"
                        title={`${food.name} - ${food.total_calories} cal`}
                      >
                        {food.name}
                      </div>
                    ))}
                    {dayFoods.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayFoods.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Receipt Details Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
              <DialogHeader className="flex-shrink-0 p-6 border-b">
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {selectedDate && formatDate(selectedDate.toISOString())}
                </DialogTitle>
                <DialogDescription>
                  {selectedDateFoods.length} food analysis{selectedDateFoods.length !== 1 ? 'es' : ''} on this day
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {selectedDateFoods.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No food analyses for this date</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                  {selectedDateFoods.map((food) => (
                    <Card key={food._id} className="border shadow-sm py-0">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{food.name}</h4>
                            {food.time && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(food.time)}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="capitalize">
                            {food.meal_type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-semibold">
                            {food.total_calories} calories
                          </span>
                        </div>

                        {food.description && (
                          <p className="text-sm text-muted-foreground">
                            {food.description}
                          </p>
                        )}

                        {food.food_items.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              Food Items:
                            </p>
                            <div className="space-y-1">
                              {food.food_items.slice(0, expandedItems[food._id] ? food.food_items.length : 3).map((item, index) => (
                                <div key={index} className="flex justify-between text-xs">
                                  <span className="truncate flex-1 mr-2">
                                    {item.name}
                                  </span>
                                  <span className="text-muted-foreground flex-shrink-0">
                                    {item.calories} cal
                                  </span>
                                </div>
                              ))}
                              {food.food_items.length > 3 && (
                                <button
                                  onClick={() => toggleItems(food._id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                >
                                  {expandedItems[food._id] 
                                    ? "Show less" 
                                    : `+${food.food_items.length - 3} more items`
                                  }
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
} 