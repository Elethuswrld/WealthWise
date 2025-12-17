import { auth } from '@/lib/firebase';
import { redirect } from 'next/navigation';
import { getUserPortfolio } from '@/lib/api';
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
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

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

export default async function PortfolioPage() {
  const user = auth.currentUser;
  if (!user) {
    redirect('/login');
  }

  const portfolio: Asset[] = await getUserPortfolio(user.uid);
  const totalValue = portfolio.reduce((sum, asset) => sum + asset.currentValue, 0);

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
              {portfolio.length > 0 ? (
                portfolio.map((asset) => {
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
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                    You have no assets in your portfolio yet.
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
