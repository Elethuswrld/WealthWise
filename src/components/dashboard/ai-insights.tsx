'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getAIFinancialInsights } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from "@/components/ui/alert-dialog"
import type { FinancialInsightsInput } from '@/ai/flows/generate-personalized-financial-insights';
  

export function AiInsights({ data }: { data: FinancialInsightsInput }) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerateInsights = async () => {
    setIsLoading(true);
    const result = await getAIFinancialInsights(data);
    setIsLoading(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.insights) {
      setInsights(result.insights);
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <Button onClick={handleGenerateInsights} disabled={isLoading} variant="outline">
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-4 w-4" />
        )}
        Get AI Insights
      </Button>
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className='flex items-center gap-2'><Sparkles className="h-5 w-5 text-primary"/> AI Financial Insights</AlertDialogTitle>
            <AlertDialogDescription className="text-foreground whitespace-pre-wrap pt-4">
                {insights}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Got it!</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
