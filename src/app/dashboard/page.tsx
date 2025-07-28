"use client";
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Folder, Crop } from "lucide-react";
import { FoodAnalysisDialog } from "@/components/FoodAnalysisDialog";
import Image from 'next/image';

import { ImageCropDialog } from "@/components/ImageCropDialog";
import { toast } from "sonner";

export default function DashboardPage() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    extracted: {
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
    };
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [hasExtractedData, setHasExtractedData] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setFile(f || null);
    setImageUrl(f ? URL.createObjectURL(f) : null);
    setResult(null);
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    handleFile(f || null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDropzoneClick = () => {
    if (!dragActive) inputRef.current?.click();
  };

  const handleAnalyze = async (croppedFile?: File) => {
    const fileToUse = croppedFile || file;
    if (!fileToUse) return;
    
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", fileToUse);
    try {
      const res = await fetch("/api/food/analyze", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      console.log("🔍 Food Analysis Result:", data);
      if (res.ok) {
        setResult(data);
        setShowDialog(true);
        setHasExtractedData(true);
      } else {
        setError(data.error || "Analysis failed");
      }
    } catch {
      setError("Server error");
    }
    setLoading(false);
  };

  const handleCropConfirm = (croppedImageBlob: Blob) => {
    const croppedFile = new File([croppedImageBlob], file?.name || 'cropped-food.jpg', {
      type: 'image/jpeg',
    });
    setShowCropDialog(false);
    handleAnalyze(croppedFile);
  };

  const handleContinueSave = () => {
    if (hasExtractedData && result) {
      setShowDialog(true);
    }
  };

  const handleSaveFood = async (data: {
    name: string;
    description: string;
    date: string;
    time: string;
    nutritionData: {
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
    };
  }) => {
    console.log("💾 Saving Food Data:", {
      name: data.name,
      description: data.description,
      date: data.date,
      nutritionData: data.nutritionData,
    });
    
    setSavingReceipt(true);
    try {
      const requestBody = {
        name: data.name,
        description: data.description,
        date: data.date,
        time: data.time,
        ...data.nutritionData,
      };
      console.log("📤 Request Body:", requestBody);
      
      const res = await fetch("/api/foods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (res.ok) {
        const savedData = await res.json();
        console.log("✅ Food Saved Successfully:", savedData);
        setShowDialog(false);
        setResult(null);
        setFile(null);
        setImageUrl(null);
        setHasExtractedData(false);
        toast.success("Food analysis saved successfully!");
      } else {
        const errorData = await res.json();
        console.log("❌ Save Food Error:", errorData);
        toast.error(errorData.error || "Failed to save food analysis");
      }
    } catch {
      toast.error("Failed to save food analysis");
    }
    setSavingReceipt(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-xl shadow-lg p-8 flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold mb-2 text-center">Food Analysis</h1>
        <p className="text-muted-foreground text-center mb-2">
          Take a photo or upload an image of your food. Our AI will analyze and extract nutrition information for you.
        </p>
        <div
          className={`w-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-4 transition-colors duration-200 cursor-pointer ${dragActive ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900"}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleDropzoneClick}
        >
          {!file && ( <>
            <Folder className="w-10 h-10 text-blue-500 mb-4" />
            <p className="text-center text-sm mb-2 text-zinc-700 dark:text-zinc-300">
              Drag your food photos here to start analyzing.<br />
              <span className="text-xs text-muted-foreground">or</span>
            </p>
            <Button type="button" variant="secondary" tabIndex={-1}>
              Browse photos
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            /> 
          </> )}
          {file && (
            <div className="mt-4 w-full flex flex-col items-center gap-2">
              <Image
                src={imageUrl!}
                width={120}
                height={120}
                alt="Food photo preview"
                className="max-w-xs max-h-64 rounded border border-muted shadow"
              />
              <span className="text-xs text-muted-foreground truncate w-full text-center">{file.name}</span>
            </div>
          )}
        </div>
        <Button 
          onClick={hasExtractedData ? handleContinueSave : () => setShowCropDialog(true)} 
          disabled={!file || loading} 
          className="w-full"
        >
          {loading ? "Analyzing..." : hasExtractedData ? (
            <>
              <Crop className="h-4 w-4 mr-2" />
              Continue Save Changes
            </>
          ) : (
            <>
              <Crop className="h-4 w-4 mr-2" />
              Crop & Analyze
            </>
          )}
        </Button>
        {error && <div className="text-red-500 text-center w-full">{error}</div>}
        {result && (
          <div className="w-full">
            <h2 className="text-lg font-semibold mb-2">Analyzed Data</h2>
            <pre className="bg-muted p-4 rounded w-full text-left overflow-x-auto text-xs">
              {JSON.stringify(result.extracted, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <FoodAnalysisDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
                    nutritionData={result?.extracted || {
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
            }}
        onConfirm={handleSaveFood}
        isLoading={savingReceipt}
      />

      <ImageCropDialog
        isOpen={showCropDialog}
        onClose={() => setShowCropDialog(false)}
        imageUrl={imageUrl || ''}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
} 