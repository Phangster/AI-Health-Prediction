# AI Food Analysis & Health Prediction

A comprehensive web application that uses AI to analyze food photos, extract nutrition information, and predict health trajectories based on diet patterns.

## 🍎 Features

### **Food Analysis**
- **AI-Powered Analysis**: Upload food photos and get detailed nutrition breakdown using GPT-4o-mini
- **Nutrition Extraction**: Automatically extracts calories, protein, carbs, fat, fiber, sugar, and sodium
- **Meal Classification**: Identifies meal types (breakfast, lunch, dinner, snack) and portion sizes
- **Image Cropping**: Built-in image cropping tool for better analysis accuracy

### **Health Tracking**
- **Weight Goal Management**: Set weight loss, gain, or maintenance goals
- **Progress Tracking**: Monitor progress against diet data with real-time calculations
- **Calorie Analysis**: Track calorie intake vs. weight goals with detailed insights
- **On-Track Indicators**: Visual feedback on whether you're meeting your goals

### **Analytics Dashboard**
- **Nutrition Trends**: Track daily nutrition patterns over time
- **Health Insights**: AI-generated insights about your diet patterns
- **Health Predictions**: Get AI-powered predictions about your health trajectory
- **Progress Visualization**: Charts and metrics showing your nutrition journey

### **Data Management**
- **History View**: Table format with grouped dates and expandable details
- **Calendar View**: Google Calendar-style interface for browsing food entries
- **Edit Functionality**: Modify nutrition data and food details
- **Search & Filter**: Easy navigation through your food history

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ai-reciept-health-prediction
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   NEXTAUTH_SECRET=your_nextauth_secret
   NEXTAUTH_URL=http://localhost:3000
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📱 Application Structure

### **Pages**
- **`/dashboard`**: Upload and analyze food photos
- **`/history`**: View food analysis history in table format
- **`/calendar`**: Calendar view of food entries
- **`/analytics`**: Health insights and predictions dashboard
- **`/settings`**: Weight goals and progress tracking

### **Key Components**
- **Food Analysis Dialog**: Review and edit extracted nutrition data
- **Image Crop Dialog**: Crop uploaded images for better analysis
- **Analytics Dashboard**: Comprehensive health insights and trends
- **Weight Goal Tracking**: Set and monitor weight objectives

### **API Endpoints**
- **`/api/food/analyze`**: AI-powered food image analysis
- **`/api/foods`**: CRUD operations for food data
- **`/api/health/predict`**: Generate health predictions
- **`/api/settings/weight-goal`**: Manage weight goals

## 🛠️ Technology Stack

### **Frontend**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Shadcn/ui**: Modern UI components
- **Tailwind CSS**: Utility-first styling
- **React Image Crop**: Image cropping functionality
- **Sonner**: Toast notifications

### **Backend**
- **NextAuth.js**: Authentication with Google OAuth
- **MongoDB**: Database with Mongoose ODM
- **OpenAI API**: GPT-4o-mini for food analysis and health predictions

### **AI Integration**
- **Food Analysis**: GPT-4o-mini analyzes food photos and extracts nutrition data
- **Health Predictions**: AI analyzes diet patterns to predict health trajectories
- **Structured Output**: JSON responses for consistent data extraction

## 📊 Data Models

### **Food Analysis**
```typescript
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
  meal_type: string;
  estimated_portion_size: string;
}
```

### **Weight Goals**
```typescript
interface WeightGoal {
  userId: string;
  goalType: 'lose' | 'gain' | 'maintain';
  targetWeight: number;
  currentWeight: number;
  startDate: string;
  targetDate: string;
  weeklyGoal: number;
}
```

### **Health Predictions**
```typescript
interface HealthPrediction {
  userId: string;
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor';
  riskFactors: string[];
  recommendations: string[];
  predictedTrajectory: string;
  timeframe: string;
  confidence: number;
  nutritionSummary: NutritionSummary;
}
```

## 🔧 Development

### **Available Scripts**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### **Code Structure**
```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── dashboard/         # Food upload & analysis
│   ├── history/          # Food history table
│   ├── calendar/         # Calendar view
│   ├── analytics/        # Health insights
│   └── settings/         # Weight goals
├── components/            # Reusable components
├── models/               # Mongoose schemas
└── lib/                  # Utilities & configurations
```

## 🎯 Key Features

### **AI-Powered Analysis**
- Upload food photos and get instant nutrition breakdown
- Automatic meal type and portion size detection
- Detailed macro and micronutrient analysis

### **Health Tracking**
- Set personalized weight goals
- Track progress against diet data
- Real-time calorie and nutrition calculations
- Visual progress indicators

### **Comprehensive Analytics**
- Nutrition trend analysis
- AI-generated health insights
- Predictive health trajectory analysis
- Historical data visualization

### **User Experience**
- Intuitive image upload and cropping
- Responsive design for all devices
- Real-time data updates
- Toast notifications for user feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for GPT-4o-mini API
- **Shadcn/ui** for beautiful UI components
- **Next.js** for the amazing React framework
- **MongoDB** for reliable data storage
