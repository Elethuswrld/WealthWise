'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AddDataDialog } from '@/components/dashboard/add-data-dialog';
import { collection, query, orderBy } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/empty-state';
import { Repeat } from 'lucide-react';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const getBadgeVariant = (type: Transaction['type']) => {
  switch (type) {
    case 'income':
      return 'default';
    case 'expense':
      return 'destructive';
    case 'investment':
      return 'secondary';
    default:
      return 'outline';
  }
};

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/transactions`), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">
            Transactions
          </h1>
          <p className="text-muted-foreground">
            A complete history of your financial activities.
          </p>
        </div>
        <AddDataDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Browse through all your recorded transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4 rounded-md">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-5 w-2/4" />
                        <Skeleton className="h-5 w-1/4" />
                    </div>
                ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    {transactions.map((tx) => (
                    <TableRow key={tx.id} className="transition-colors duration-200 hover:bg-muted/50 cursor-pointer">
                        <TableCell className="font-medium">{tx.category}</TableCell>
                        <TableCell>
                        <Badge variant={getBadgeVariant(tx.type)} className="capitalize">{tx.type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{tx.notes || '-'}</TableCell>
                        <TableCell>
                        {tx.date ? format(new Date(tx.date.seconds * 1000), 'MMM d, yyyy') : 'N/A'}
                        </TableCell>
                        <TableCell className={cn(
                        "text-right font-mono",
                        tx.type === 'income' ? 'text-primary' : 'text-destructive'
                        )}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <EmptyState 
                title="No transactions yet"
                description="Add your first transaction to see your history here."
                icon={Repeat}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
