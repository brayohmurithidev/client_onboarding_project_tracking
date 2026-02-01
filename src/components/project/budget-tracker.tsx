/**
 * Budget Tracker Component
 */

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DollarSign, Edit, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Currency = "KSH" | "USD" | "EUR";

const CURRENCIES: Array<{ code: Currency; symbol: string; name: string }> = [
  { code: "KSH", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

interface BudgetTrackerProps {
  projectId: string;
  budget: number | null;
  spent: number | null;
  currency?: string;
  onUpdate?: () => void;
}

export function BudgetTracker({ projectId, budget, spent = 0, currency = "USD", onUpdate }: BudgetTrackerProps) {
  const [open, setOpen] = useState(false);
  const [budgetInput, setBudgetInput] = useState(budget?.toString() || "");
  const [spentInput, setSpentInput] = useState(spent?.toString() || "0");
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(currency as Currency);
  const [loading, setLoading] = useState(false);

  const budgetValue = budget || 0;
  const spentValue = spent || 0;
  const remaining = budgetValue - spentValue;
  const percentageUsed = budgetValue > 0 ? (spentValue / budgetValue) * 100 : 0;
  const isOverBudget = spentValue > budgetValue && budgetValue > 0;

  const updateBudget = async () => {
    const newBudget = parseFloat(budgetInput) || null;
    const newSpent = parseFloat(spentInput) || 0;

    if (newBudget !== null && newBudget < 0) {
      toast.error("Budget cannot be negative");
      return;
    }

    if (newSpent < 0) {
      toast.error("Spent amount cannot be negative");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({
          budget: newBudget,
          spent: newSpent,
          currency: selectedCurrency,
        })
        .eq("id", projectId);

      if (error) throw error;

      toast.success("Budget updated");
      setOpen(false);
      onUpdate?.();
    } catch (error) {
      console.error("Error updating budget:", error);
      toast.error("Failed to update budget");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    const currencyData = CURRENCIES.find((c) => c.code === selectedCurrency);
    const symbol = currencyData?.symbol || "$";
    
    return `${symbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  if (!budget && !spent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5" />
            Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <DollarSign className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="mb-3 text-sm text-muted-foreground">
              No budget set for this project
            </p>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Set Budget</Button>
              </DialogTrigger>
              <BudgetDialog
                budgetInput={budgetInput}
                setBudgetInput={setBudgetInput}
                spentInput={spentInput}
                setSpentInput={setSpentInput}
                selectedCurrency={selectedCurrency}
                setSelectedCurrency={setSelectedCurrency}
                loading={loading}
                updateBudget={updateBudget}
              />
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currencySymbol = CURRENCIES.find((c) => c.code === selectedCurrency)?.symbol || "$";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <DollarSign className="h-5 w-5" />
            Budget ({currencySymbol})
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Edit className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <BudgetDialog
              budgetInput={budgetInput}
              setBudgetInput={setBudgetInput}
              spentInput={spentInput}
              setSpentInput={setSpentInput}
              selectedCurrency={selectedCurrency}
              setSelectedCurrency={setSelectedCurrency}
              loading={loading}
              updateBudget={updateBudget}
            />
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">
              {percentageUsed.toFixed(0)}%
              {isOverBudget && (
                <AlertTriangle className="ml-1 inline h-4 w-4 text-red-500" />
              )}
            </span>
          </div>
          <Progress
            value={Math.min(percentageUsed, 100)}
            className={cn(
              "h-2",
              isOverBudget && "[&>div]:bg-red-500",
              percentageUsed > 80 && percentageUsed < 100 && "[&>div]:bg-yellow-500"
            )}
          />
        </div>

        {/* Budget breakdown */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1 rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="text-sm font-semibold">{formatCurrency(budgetValue)}</p>
          </div>
          <div className="space-y-1 rounded-lg bg-muted/50 p-2">
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="text-sm font-semibold">{formatCurrency(spentValue)}</p>
          </div>
          <div
            className={cn(
              "space-y-1 rounded-lg bg-muted/50 p-2",
              isOverBudget && "bg-red-500/10"
            )}
          >
            <p className="text-xs text-muted-foreground">
              {isOverBudget ? "Over" : "Remaining"}
            </p>
            <p
              className={cn(
                "text-sm font-semibold",
                isOverBudget ? "text-red-600" : "text-green-600"
              )}
            >
              {formatCurrency(Math.abs(remaining))}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 rounded-lg border p-2 text-sm">
          {isOverBudget ? (
            <>
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-red-600">Over budget</span>
            </>
          ) : percentageUsed > 80 ? (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span className="text-yellow-600">Approaching limit</span>
            </>
          ) : (
            <>
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-600">On track</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Budget Dialog Component
function BudgetDialog({
  budgetInput,
  setBudgetInput,
  spentInput,
  setSpentInput,
  selectedCurrency,
  setSelectedCurrency,
  loading,
  updateBudget,
}: {
  budgetInput: string;
  setBudgetInput: (value: string) => void;
  spentInput: string;
  setSpentInput: (value: string) => void;
  selectedCurrency: Currency;
  setSelectedCurrency: (value: Currency) => void;
  loading: boolean;
  updateBudget: () => void;
}) {
  const currencyData = CURRENCIES.find((c) => c.code === selectedCurrency);
  
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Update Budget</DialogTitle>
        <DialogDescription>
          Set the budget and track spending for this project
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="currency">Currency</Label>
          <Select
            value={selectedCurrency}
            onValueChange={(value) => setSelectedCurrency(value as Currency)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((curr) => (
                <SelectItem key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.name} ({curr.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Budget ({currencyData?.symbol})</Label>
          <Input
            id="budget"
            type="number"
            step="0.01"
            min="0"
            placeholder="10000"
            value={budgetInput}
            onChange={(e) => setBudgetInput(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="spent">Amount Spent ({currencyData?.symbol})</Label>
          <Input
            id="spent"
            type="number"
            step="0.01"
            min="0"
            placeholder="0"
            value={spentInput}
            onChange={(e) => setSpentInput(e.target.value)}
          />
        </div>
        <Button onClick={updateBudget} disabled={loading} className="w-full">
          {loading ? "Updating..." : "Update Budget"}
        </Button>
      </div>
    </DialogContent>
  );
}
