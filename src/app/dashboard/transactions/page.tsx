import { auth } from '@/lib/firebase';
import { redirect } from 'next/navigation';
import { getUserTransactions } from '@/lib/api';
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

export default async function TransactionsPage() {
  const user = auth.currentUser;
  if (!user) {
    redirect('/login');
  }

  const transactions: Transaction[] = await getUserTransactions(user.uid);

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
              {transactions.length > 0 ? (
                transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">{tx.category}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(tx.type)} className="capitalize">{tx.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{tx.notes || '-'}</TableCell>
                    <TableCell>
                      {tx.date ? format(tx.date.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right font-mono",
                      tx.type === 'income' ? 'text-primary' : 'text-destructive'
                    )}>
                      {tx.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(tx.amount))}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    No transactions yet. Add one to get started!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
