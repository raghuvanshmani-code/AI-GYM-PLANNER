import React, { useState, useCallback, useEffect } from 'react';
import type { DietPlan, UserData } from './types';
import { generateDietPlan } from './services/geminiService';
import DietForm from './components/DietForm';
import DietPlanDisplay from './components/DietPlanDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import Header from './components/Header';
import Hero from './components/Hero';

const App: React.FC = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSavedPlan, setHasSavedPlan] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem('dietPlan');
      if (savedPlan) {
        setHasSavedPlan(true);
      }
    } catch (error) {
      console.error("Could not access localStorage:", error);
    }
  }, []);

  const handleFormSubmit = useCallback(async (data: UserData) => {
    setIsLoading(true);
    setError(null);
    setDietPlan(null);
    setSummary('');
    setUserData(data);

    try {
      const result = await generateDietPlan(data);
      
      const jsonRegex = /```json\n([\s\S]*?)\n```/;
      const match = result.match(jsonRegex);
      
      let planData;
      let summaryText;

      if (match && match[1]) {
          const jsonString = match[1];
          planData = JSON.parse(jsonString);
          summaryText = result.substring(match[0].length).trim();
      } else {
         const firstBrace = result.indexOf('{');
         const lastBrace = result.lastIndexOf('}');
         if (firstBrace !== -1 && lastBrace !== -1) {
            const jsonString = result.substring(firstBrace, lastBrace + 1);
            planData = JSON.parse(jsonString);
            summaryText = result.substring(lastBrace + 1).trim();
         } else {
            throw new Error("Could not find valid JSON in the AI response.");
         }
      }

      setDietPlan(planData);
      setSummary(summaryText);
      try {
        localStorage.setItem('dietPlan', JSON.stringify(planData));
        localStorage.setItem('dietPlanSummary', summaryText);
        setHasSavedPlan(true);
      } catch (e) {
        console.error("Failed to save plan to localStorage:", e);
      }
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? `Failed to generate diet plan: ${e.message}` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setUserData(null);
    setDietPlan(null);
    setSummary('');
    setError(null);
    setIsLoading(false);
    try {
      localStorage.removeItem('dietPlan');
      localStorage.removeItem('dietPlanSummary');
      setHasSavedPlan(false);
    } catch (e) {
      console.error("Failed to clear localStorage:", e);
    }
  }, []);

  const loadSavedPlan = useCallback(() => {
    try {
      const savedPlanString = localStorage.getItem('dietPlan');
      const savedSummary = localStorage.getItem('dietPlanSummary');
      if (savedPlanString && savedSummary) {
        setDietPlan(JSON.parse(savedPlanString));
        setSummary(savedSummary);
        setHasSavedPlan(false); // Hide button after loading
      }
    } catch (e) {
      console.error("Failed to load plan from localStorage:", e);
      setError("Failed to load saved plan. It might be corrupted.");
      localStorage.removeItem('dietPlan');
      localStorage.removeItem('dietPlanSummary');
      setHasSavedPlan(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        {!dietPlan && !isLoading && !error && (
            <>
              <Hero />
              {hasSavedPlan && (
                <div className="text-center -mt-8 mb-10">
                  <button
                    onClick={loadSavedPlan}
                    className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
                  >
                    Load Previous Plan
                  </button>
                </div>
              )}
            </>
          )}
        
        {dietPlan ? (
          <DietPlanDisplay dietPlan={dietPlan} summary={summary} onReset={handleReset} />
        ) : (
          <div className="max-w-4xl mx-auto">
            {isLoading ? (
              <LoadingSpinner />
            ) : (
              <>
                {error && <ErrorMessage message={error} />}
                <DietForm onSubmit={handleFormSubmit} isLoading={isLoading} />
              </>
            )}
          </div>
        )}
      </main>
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>Powered by Google Gemini. This is not medical advice. Always consult a healthcare professional.</p>
      </footer>
    </div>
  );
};

export default App;