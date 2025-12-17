'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
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
import { addTransaction, addAsset } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function AddTransactionForm({ onFinished }: { onFinished: () => void }) {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await addTransaction(formData);

    setIsLoading(false);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
      toast({ title: 'Success', description: 'Transaction added.' });
      onFinished();
      router.refresh();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="tx-type">Type</Label>
                <Select name="type" required>
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
                <Input id="tx-amount" name="amount" type="number" step="0.01" placeholder="0.00" required />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="tx-category">Category</Label>
            <Input id="tx-category" name="category" placeholder="e.g., Groceries, Salary" required />
        </div>
        <div className="space-y-2">
            <Label htmlFor="tx-notes">Notes (Optional)</Label>
            <Textarea id="tx-notes" name="notes" placeholder="e.g., Weekly shopping" />
        </div>
        <DialogFooter>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Transaction
            </Button>
        </DialogFooter>
    </form>
  );
}

function AddAssetForm({ onFinished }: { onFinished: () => void }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
  
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsLoading(true);
  
      const formData = new FormData(event.currentTarget);
      const result = await addAsset(formData);
  
      setIsLoading(false);
      if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
      } else {
        toast({ title: 'Success', description: 'Asset added.' });
        onFinished();
        router.refresh();
      }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="asset-type">Asset Type</Label>
                <Select name="assetType" required>
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
                <Input id="asset-name" name="assetName" placeholder="e.g., Apple Inc., Bitcoin" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="invested-amount">Invested Amount</Label>
                    <Input id="invested-amount" name="investedAmount" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="current-value">Current Value</Label>
                    <Input id="current-value" name="currentValue" type="number" step="0.01" placeholder="0.00" required />
                </div>
            </div>
            <DialogFooter>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Asset
                </Button>
            </DialogFooter>
        </form>
      );
}

export function AddDataDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add to Your Dashboard</DialogTitle>
          <DialogDescription>
            Log a new transaction or add a new asset to your portfolio.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="transaction" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transaction">Transaction</TabsTrigger>
                <TabsTrigger value="asset">Asset</TabsTrigger>
            </TabsList>
            <TabsContent value="transaction" className="py-4">
                <AddTransactionForm onFinished={() => setOpen(false)} />
            </TabsContent>
            <TabsContent value="asset" className="py-4">
                <AddAssetForm onFinished={() => setOpen(false)} />
            </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
