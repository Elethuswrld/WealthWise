'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Transaction, WithId } from '@/lib/types';
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
import { Repeat, MoreHorizontal, Trash2, Pencil, ArrowUpDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { deleteTransaction } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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

type SortKey = 'category' | 'type' | 'amount' | 'date';
type SortDirection = 'asc' | 'desc';

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [dialogData, setDialogData] = useState<{ transaction?: WithId<Transaction>, asset?: any } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');


  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, `users/${user.uid}/transactions`), orderBy('date', 'desc'));
  }, [firestore, user]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsQuery);
  
  const filteredTransactions = useMemo(() => {
    if (!transactions) return [];
    if (filter === 'all') return transactions;
    return transactions.filter((tx) => tx.type === filter);
  }, [transactions, filter]);

  const sortedTransactions = useMemo(() => {
    return [...filteredTransactions].sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];

        // Handle Firestore Timestamps for dates
        if (sortKey === 'date') {
            valA = a.date?.seconds || 0;
            valB = b.date?.seconds || 0;
        }

        let result = 0;
        if (valA < valB) {
            result = -1;
        } else if (valA > valB) {
            result = 1;
        }
        
        return sortDirection === 'asc' ? result : -result;
    });
  }, [filteredTransactions, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
        setSortKey(key);
        setSortDirection('desc');
    }
  };


  const handleEdit = (transaction: WithId<Transaction>) => {
    setDialogData({ transaction });
    setIsDialogOpen(true);
  };

  const handleDeleteInitiate = (transactionId: string) => {
    setItemToDelete(transactionId);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const result = await deleteTransaction(itemToDelete);
    setIsDeleting(false);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        toast({ title: 'Success', description: 'Transaction deleted.' });
        router.refresh();
    }
    setIsAlertOpen(false);
    setItemToDelete(null);
  };

  const renderSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortDirection === 'desc' ? '▼' : '▲';
  };


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
        <Button onClick={() => { setDialogData(null); setIsDialogOpen(true); }}>Add New</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>
            Browse and filter through all your recorded transactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs value={filter} onValueChange={setFilter} className="mb-4">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="income">Income</TabsTrigger>
                    <TabsTrigger value="expense">Expenses</TabsTrigger>
                    <TabsTrigger value="investment">Investments</TabsTrigger>
                </TabsList>
            </Tabs>
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
          ) : sortedTransactions && sortedTransactions.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('category')}>
                            Category {renderSortIcon('category')}
                        </Button>
                    </TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('type')}>
                            Type {renderSortIcon('type')}
                        </Button>
                    </TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>
                        <Button variant="ghost" onClick={() => handleSort('date')}>
                            Date {renderSortIcon('date')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">
                        <Button variant="ghost" onClick={() => handleSort('amount')}>
                            Amount {renderSortIcon('amount')}
                        </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedTransactions.map((tx) => (
                    <TableRow key={tx.id}>
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
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => handleEdit(tx)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDeleteInitiate(tx.id)} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
            </Table>
          ) : (
            <EmptyState 
                title="No transactions found"
                description={filter === 'all' ? "Add your first transaction to see your history here." : `You have no transactions of type '${filter}'.`}
                icon={Repeat}
            />
          )}
        </CardContent>
      </Card>
      <AddDataDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        initialData={dialogData}
      />
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the transaction.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete'}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
