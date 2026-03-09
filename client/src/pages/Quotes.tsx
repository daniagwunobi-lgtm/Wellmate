import { PageTransition } from "@/components/layout/PageTransition";
import { useDailyQuotes } from "@/hooks/use-quotes";
import { Button } from "@/components/ui/button";
import { Download, Share2, Quote as QuoteIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Quotes() {
  const { data: quotes, isLoading } = useDailyQuotes();

  return (
    <PageTransition>
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Daily Inspiration</h1>
          <p className="text-muted-foreground mt-2 text-lg">Words to build mental strength and purpose.</p>
        </div>
        <div className="bg-secondary text-secondary-foreground px-4 py-2 rounded-full text-sm font-bold shadow-sm inline-flex items-center gap-2 w-max">
          <QuoteIcon className="w-4 h-4" />
          Refreshed Daily
        </div>
      </header>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => <Skeleton key={i} className="aspect-square rounded-3xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {quotes?.map((quote: any, i: number) => (
            <div key={i} className="group relative">
              {/* Quote Card */}
              <div className="aspect-square bg-[#B2AC88] text-[#36454F] p-10 rounded-3xl shadow-xl flex flex-col justify-between relative overflow-hidden transition-transform duration-500 group-hover:-translate-y-2">
                {/* Abstract graphic */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/5 rounded-full blur-xl" />
                
                <QuoteIcon className="w-10 h-10 opacity-30 mb-6" />
                
                <p className="text-2xl lg:text-3xl font-bold leading-tight font-serif italic z-10">
                  "{quote.content}"
                </p>
                
                <div className="z-10 mt-8">
                  <div className="h-px w-12 bg-[#36454F]/20 mb-4" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-80">{quote.theme}</p>
                  <p className="text-xs opacity-60 mt-1">Generated with Humanity Hub</p>
                </div>
              </div>

              {/* Action Buttons (Reveal on Hover) */}
              <div className="absolute -bottom-4 left-0 w-full flex justify-center gap-3 opacity-0 group-hover:opacity-100 group-hover:bottom-4 transition-all duration-300 z-20">
                <Button size="icon" className="w-12 h-12 rounded-full shadow-xl bg-white text-foreground hover:bg-gray-50">
                  <Download className="w-5 h-5" />
                </Button>
                <Button size="icon" className="w-12 h-12 rounded-full shadow-xl bg-[#36454F] text-white hover:bg-black">
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageTransition>
  );
}
