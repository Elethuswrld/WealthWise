'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { addTransaction, addAsset, updateTransaction, updateAsset } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { WithId, Transaction, Asset } from '@/lib/types';
import { useUser } from '@/firebase';

interface AddTransactionFormProps {
    onFinished: () => void;
    initialData?: WithId<Transaction>;
}

function AddTransactionForm({ onFinished, initialData }: AddTransactionFormProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
    }
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = isEditing 
        ? await updateTransaction(user.uid, initialData.id, formData)
        : await addTransaction(user.uid, formData);

    setIsLoading(false);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: `Transaction ${isEditing ? 'updated' : 'added'}.` });
      onFinished();
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="tx-type">Type</Label>
                <Select name="type" required defaultValue={initialData?.type}>
                    <SelectTrigger id="tx-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="investment">Investment</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="tx-amount">Amount</Label>
                <Input id="tx-amount" name="amount" type="number" step="0.01" placeholder="0.00" required defaultValue={initialData?.amount} />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="tx-category">Category</Label>
            <Input id="tx-category" name="category" placeholder="e.g., Groceries, Salary" required defaultValue={initialData?.category} />
        </div>
        <div className="space-y-2">
            <Label htmlFor="tx-notes">Notes (Optional)</Label>
            <Textarea id="tx-notes" name="notes" placeholder="e.g., Weekly shopping" defaultValue={initialData?.notes} />
        </div>
        <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditing ? 'Save Changes' : 'Add Transaction'}
            </Button>
        </div>
    </form>
  );
}

interface AddAssetFormProps {
    onFinished: () => void;
    initialData?: WithId<Asset>;
}

function AddAssetForm({ onFinished, initialData }: AddAssetFormProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const isEditing = !!initialData;
  
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!user) {
        toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
        return;
      }
      setIsLoading(true);
  
      const formData = new FormData(event.currentTarget);
      const result = isEditing
        ? await updateAsset(user.uid, initialData.id, formData)
        : await addAsset(user.uid, formData);
  
      setIsLoading(false);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Success', description: `Asset ${isEditing ? 'updated' : 'added'}.` });
        onFinished();
        router.refresh();
      }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="asset-type">Asset Type</Label>
                <Select name="assetType" required defaultValue={initialData?.assetType}>
                    <SelectTrigger id="asset-type"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Stock">Stock</SelectItem>
                        <SelectItem value="Crypto">Crypto</SelectItem>
                        <SelectItem value="Forex">Forex</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="asset-name">Asset Name</Label>
                <Input id="asset-name" name="assetName" placeholder="e.g., Apple Inc., Bitcoin" required defaultValue={initialData?.assetName} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="invested-amount">Invested Amount</Label>
                    <Input id="invested-amount" name="investedAmount" type="number" step="0.01" placeholder="0.00" required defaultValue={initialData?.investedAmount} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="current-value">Current Value</Label>
                    <Input id="current-value" name="currentValue" type="number" step="0.01" placeholder="0.00" required defaultValue={initialData?.currentValue} />
                </div>
            </div>
            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Save Changes' : 'Add Asset'}
                </Button>
            </div>
        </form>
      );
}

interface AddDataDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialData?: {
        transaction?: WithId<Transaction>;
        asset?: WithId<Asset>;
    } | null;
}

export function AddDataDialog({ open, onOpenChange, initialData }: AddDataDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setCurrentOpen = isControlled ? onOpenChange : setInternalOpen;
  
  const isEditing = !!(initialData?.transaction || initialData?.asset);
  const defaultTab = initialData?.transaction ? "transaction" : initialData?.asset ? "asset" : "transaction";

  // Effect to sync dialog state if it's controlled from outside
  useEffect(() => {
    if (isControlled) {
        setInternalOpen(open);
    }
  }, [open, isControlled]);


  const onDialogClose = (open: boolean) => {
    if (!open) {
        // Reset state or handle close logic
    }
    setCurrentOpen(open);
  }

  return (
    <Dialog open={currentOpen} onOpenChange={onDialogClose}>
      {!isControlled && <DialogTrigger asChild><Button>Add New</Button></DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Entry' : 'Add to Your Dashboard'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for your entry.' : 'Log a new transaction or add a new asset to your portfolio.'}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transaction" disabled={isEditing && !!initialData?.asset}>Transaction</TabsTrigger>
                <TabsTrigger value="asset" disabled={isEditing && !!initialData?.transaction}>Asset</TabsTrigger>
            </TabsList>
            <TabsContent value="transaction" className="py-4">
                <AddTransactionForm 
                    onFinished={() => setCurrentOpen(false)}
                    initialData={initialData?.transaction}
                />
            </TabsContent>
            <TabsContent value="asset" className="py-4">
                <AddAssetForm 
                    onFinished={() => setCurrentOpen(false)}
                    initialData={initialData?.asset}
                />
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
