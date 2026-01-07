'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2, Calendar as CalendarIcon } from 'lucide-react';
import { addGoal, updateGoal } from '@/app/actions';
import type { WithId, Goal } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const goalSchema = z.object({
    name: z.string().min(3, 'Goal name must be at least 3 characters.'),
    targetAmount: z.coerce.number().positive('Target amount must be positive.'),
    currentAmount: z.coerce.number().min(0, 'Current amount cannot be negative.'),
    targetDate: z.date().optional(),
});

type GoalFormValues = z.infer<typeof goalSchema>;

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: WithId<Goal>;
}

export function GoalDialog({ open, onOpenChange, goal }: GoalDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!goal;

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: goal?.name || '',
      targetAmount: goal?.targetAmount || 1000,
      currentAmount: goal?.currentAmount || 0,
      targetDate: goal?.targetDate ? goal.targetDate.toDate() : undefined,
    }
  });

  const onSubmit = async (data: GoalFormValues) => {
    setIsLoading(true);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('targetAmount', String(data.targetAmount));
    formData.append('currentAmount', String(data.currentAmount));
    if (data.targetDate) {
        formData.append('targetDate', data.targetDate.toISOString());
    }
    
    const result = isEditing
      ? await updateGoal(goal.id, formData)
      : await addGoal(formData);

    setIsLoading(false);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: `Goal ${isEditing ? 'updated' : 'added'}.` });
      onOpenChange(false);
      form.reset();
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      if (!o) {
        form.reset();
      }
      onOpenChange(o);
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Goal' : 'Add a New Goal'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for your goal.' : 'Define a new financial goal to track.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input id="name" {...form.register('name')} placeholder="e.g., Vacation to Bali" />
                {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="currentAmount">Current Amount</Label>
                    <Input id="currentAmount" type="number" step="0.01" {...form.register('currentAmount')} />
                    {form.formState.errors.currentAmount && <p className="text-sm text-destructive">{form.formState.errors.currentAmount.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="targetAmount">Target Amount</Label>
                    <Input id="targetAmount" type="number" step="0.01" {...form.register('targetAmount')} />
                    {form.formState.errors.targetAmount && <p className="text-sm text-destructive">{form.formState.errors.targetAmount.message}</p>}
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="targetDate">Target Date (Optional)</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        className={cn(
                        "w-full justify-start text-left font-normal",
                        !form.watch('targetDate') && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch('targetDate') ? format(form.watch('targetDate')!, "PPP") : <span>Pick a date</span>}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={form.watch('targetDate')}
                        onSelect={(date) => form.setValue('targetDate', date)}
                        initialFocus
                    />
                    </PopoverContent>
                </Popover>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Save Changes' : 'Add Goal'}
                </Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
