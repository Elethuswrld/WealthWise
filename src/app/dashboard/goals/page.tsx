'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Goal, WithId } from '@/lib/types';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Target, AlertCircle } from 'lucide-react';
import EmptyState from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { GoalCard } from '@/components/dashboard/goals/goal-card';
import { GoalDialog } from '@/components/dashboard/goals/goal-dialog';

export default function GoalsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<WithId<Goal> | undefined>(undefined);

  const goalsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/goals`), orderBy('createdAt', 'desc'));
  }, [firestore, user]);

  const { data: goals, isLoading, error } = useCollection<Goal>(goalsQuery);
  
  const handleAddGoal = () => {
    setSelectedGoal(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditGoal = (goal: WithId<Goal>) => {
    setSelectedGoal(goal);
    setIsDialogOpen(true);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-lg" />
          ))}
        </div>
      );
    }
    if (error) {
      return (
        <EmptyState
          title="Error loading goals"
          description="We couldn't fetch your data. Please try again later."
          icon={AlertCircle}
        />
      );
    }
    if (goals && goals.length > 0) {
      return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal} onEdit={() => handleEditGoal(goal)} />
          ))}
        </div>
      );
    }
    return (
      <EmptyState
        title="No goals set yet"
        description="Define your financial goals to start tracking your progress."
        icon={Target}
      />
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">
            Financial Goals
          </h1>
          <p className="text-muted-foreground">
            Track your progress towards your financial ambitions.
          </p>
        </div>
        <Button onClick={handleAddGoal}>Add New Goal</Button>
      </div>
      
      {renderContent()}

      <GoalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        goal={selectedGoal}
      />
    </div>
  );
}
