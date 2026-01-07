'use client';

import CategorySpendingChart from "@/components/dashboard/reports/category-spending-chart";

export default function ReportsPage() {
    return (
        <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                <h1 className="text-2xl md:text-3xl font-bold font-headline">
                    Financial Reports
                </h1>
                <p className="text-muted-foreground">
                    A detailed analysis of your financial data.
                </p>
                </div>
            </div>

            <CategorySpendingChart />

        </div>
    );
}
