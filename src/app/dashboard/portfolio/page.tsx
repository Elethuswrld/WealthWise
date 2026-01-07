'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Asset, WithId } from '@/lib/types';
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
import { cn } from '@/lib/utils';
import { AddDataDialog } from '@/components/dashboard/add-data-dialog';
import { ArrowUpRight, ArrowDownRight, Minus, Wallet, MoreHorizontal, Trash2, Pencil } from 'lucide-react';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { deleteAsset } from '@/app/actions';


const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const formatPercent = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

export default function PortfolioPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();

  const [dialogData, setDialogData] = useState<{ transaction?: any, asset?: WithId<Asset> } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const portfolioQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/portfolio`);
  }, [firestore, user]);

  const { data: portfolio, isLoading } = useCollection<Asset>(portfolioQuery);

  const handleEdit = (asset: WithId<Asset>) => {
    setDialogData({ asset });
    setIsDialogOpen(true);
  };

  const handleDeleteInitiate = (assetId: string) => {
    setItemToDelete(assetId);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    const result = await deleteAsset(itemToDelete);
    setIsDeleting(false);

    if (result.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error });
    } else {
        toast({ title: 'Success', description: 'Asset deleted.' });
        router.refresh();
    }
    setIsAlertOpen(false);
    setItemToDelete(null);
  };

  const totalValue = portfolio ? portfolio.reduce((sum, asset) => sum + asset.currentValue, 0) : 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">
            Portfolio
          </h1>
          <p className="text-muted-foreground">
            An overview of all your invested assets.
          </p>
        </div>
        <Button onClick={() => { setDialogData({ asset: undefined }); setIsDialogOpen(true); }}>Add New</Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>
            Here are the assets you currently hold. Total portfolio value:{' '}
            <span className="font-bold text-primary">{formatCurrency(totalValue)}</span>
          </CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 rounded-md">
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="h-6 w-24 rounded-full" />
                            <Skeleton className="h-5 w-1/4 ml-auto" />
                            <Skeleton className="h-5 w-1/4 ml-auto" />
                        </div>
                    ))}
                </div>
            ) : portfolio && portfolio.length > 0 ? (
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Current Value</TableHead>
                        <TableHead className="text-right">Gain / Loss</TableHead>
                        <TableHead className="text-right">Gain / Loss (%)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {portfolio.map((asset) => {
                        const gainLoss = asset.currentValue - asset.investedAmount;
                        const gainLossPercent = asset.investedAmount === 0 ? 0 : gainLoss / asset.investedAmount;
                        const isGain = gainLoss > 0;
                        const isLoss = gainLoss < 0;

                        return (
                            <TableRow key={asset.id}>
                            <TableCell className="font-medium">{asset.assetName}</TableCell>
                            <TableCell>
                                <Badge variant="secondary" className="capitalize">{asset.assetType}</Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono">{formatCurrency(asset.currentValue)}</TableCell>
                            <TableCell className={cn(
                                "text-right font-mono flex items-center justify-end gap-1",
                                isGain && "text-primary",
                                isLoss && "text-destructive"
                            )}>
                                {isGain && <ArrowUpRight className="h-4 w-4" />}
                                {isLoss && <ArrowDownRight className="h-4 w-4" />}
                                {!isGain && !isLoss && <Minus className="h-4 w-4" />}
                                {formatCurrency(gainLoss)}
                            </TableCell>
                            <TableCell className={cn(
                                "text-right font-mono",
                                isGain && "text-primary",
                                isLoss && "text-destructive"
                            )}>
                                {formatPercent(gainLossPercent)}
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
                                    <DropdownMenuItem onSelect={() => handleEdit(asset)}>
                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDeleteInitiate(asset.id)} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>
                </Table>
            ) : (
                <EmptyState
                    title="No assets in your portfolio"
                    description="Add an asset to see your allocation here."
                    icon={Wallet}
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
                      This action cannot be undone. This will permanently delete the asset.
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
