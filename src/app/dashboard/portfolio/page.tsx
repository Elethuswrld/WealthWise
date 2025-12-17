'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import type { Asset } from '@/lib/types';
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
import { ArrowUpRight, ArrowDownRight, Minus, Wallet } from 'lucide-react';
import { collection } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import EmptyState from '@/components/empty-state';

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

  const portfolioQuery = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `users/${user.uid}/portfolio`);
  }, [firestore, user]);

  const { data: portfolio, isLoading } = useCollection<Asset>(portfolioQuery);

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
        <AddDataDialog />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
          <CardDescription>
            Here are the assets you currently hold. Total portfolio value: {' '}
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
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {portfolio.map((asset) => {
                        const gainLoss = asset.currentValue - asset.investedAmount;
                        const gainLossPercent = asset.investedAmount === 0 ? 0 : gainLoss / asset.investedAmount;
                        const isGain = gainLoss > 0;
                        const isLoss = gainLoss < 0;

                        return (
                            <TableRow key={asset.id} className="transition-colors duration-200 hover:bg-muted/50 cursor-pointer">
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
    </div>
  );
}
