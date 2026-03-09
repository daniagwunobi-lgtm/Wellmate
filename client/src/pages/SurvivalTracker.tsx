import { PageTransition } from "@/components/layout/PageTransition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFinancial, useUpsertFinancial } from "@/hooks/use-financial";
import { useState, useEffect } from "react";
import { Calculator, AlertCircle, ShieldCheck } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export default function SurvivalTracker() {
  const { data, isLoading } = useFinancial();
  const upsert = useUpsertFinancial();
  
  const [formData, setFormData] = useState({
    rent: 0, food: 0, utilities: 0, transport: 0, income: 0, savings: 0
  });

  useEffect(() => {
    if (data) setFormData(data);
  }, [data]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: parseInt(e.target.value) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsert.mutate(formData);
  };

  const totalExpenses = formData.rent + formData.food + formData.utilities + formData.transport;
  const bufferMonths = totalExpenses > 0 ? (formData.savings / totalExpenses).toFixed(1) : "0";
  const isStressed = totalExpenses > formData.income;

  const chartData = [
    { name: 'Rent', value: formData.rent, color: 'hsl(var(--primary))' },
    { name: 'Food', value: formData.food, color: '#f59e0b' },
    { name: 'Utilities', value: formData.utilities, color: '#0ea5e9' },
    { name: 'Transport', value: formData.transport, color: '#8b5cf6' },
  ].filter(d => d.value > 0);

  return (
    <PageTransition>
      <header className="mb-8 flex items-center gap-4">
        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Survival Tracker</h1>
          <p className="text-muted-foreground mt-1">Manage financial stress by understanding your baseline.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-lg shadow-black/5">
          <h2 className="text-xl font-bold mb-6">Monthly Numbers</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="Monthly Income" name="income" value={formData.income} onChange={handleChange} />
              <NumberInput label="Total Savings" name="savings" value={formData.savings} onChange={handleChange} />
            </div>
            
            <hr className="border-border" />
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Fixed Expenses</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <NumberInput label="Rent/Mortgage" name="rent" value={formData.rent} onChange={handleChange} />
              <NumberInput label="Food/Groceries" name="food" value={formData.food} onChange={handleChange} />
              <NumberInput label="Utilities" name="utilities" value={formData.utilities} onChange={handleChange} />
              <NumberInput label="Transport" name="transport" value={formData.transport} onChange={handleChange} />
            </div>

            <Button type="submit" disabled={upsert.isPending} className="w-full h-12 rounded-xl text-lg font-bold">
              {upsert.isPending ? "Saving..." : "Update Tracker"}
            </Button>
          </form>
        </div>

        <div className="space-y-6">
          <div className={`rounded-3xl p-8 text-white shadow-xl overflow-hidden relative
            ${isStressed ? 'bg-rose-500 shadow-rose-500/20' : 'bg-emerald-600 shadow-emerald-600/20'}`}>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                {isStressed ? <AlertCircle className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                <h2 className="text-xl font-bold opacity-90">Monthly Survival Number</h2>
              </div>
              <div className="text-6xl font-black mb-6">${totalExpenses.toLocaleString()}</div>
              
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/20">
                <div>
                  <p className="text-sm opacity-80 mb-1">Income Gap</p>
                  <p className="text-2xl font-bold">
                    ${Math.abs(formData.income - totalExpenses).toLocaleString()}
                    <span className="text-sm font-normal opacity-80 ml-1">
                      {isStressed ? 'short' : 'surplus'}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-80 mb-1">Safety Buffer</p>
                  <p className="text-2xl font-bold">{bufferMonths} <span className="text-sm font-normal opacity-80">months</span></p>
                </div>
              </div>
            </div>
            {/* Background pattern */}
            <div className="absolute right-[-10%] bottom-[-20%] w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="bg-card rounded-3xl p-6 border border-border/50 h-[300px]">
            <h3 className="font-bold mb-4">Expense Breakdown</h3>
            {chartData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {chartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip 
                    formatter={(value: number) => `$${value}`}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                 />
               </PieChart>
             </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Enter expenses to see breakdown
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function NumberInput({ label, name, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">{label}</label>
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">$</span>
        <Input 
          type="number" 
          name={name}
          value={value || ""} 
          onChange={onChange}
          className="pl-8 h-12 rounded-xl bg-secondary/50 border-transparent font-bold text-lg"
        />
      </div>
    </div>
  );
}
