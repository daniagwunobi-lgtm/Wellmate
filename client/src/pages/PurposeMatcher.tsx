import { PageTransition } from "@/components/layout/PageTransition";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useSkills, useSetSkills, usePurposeMatch } from "@/hooks/use-skills";
import { useState, useEffect } from "react";
import { Compass, X, Sparkles, HandHeart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PurposeMatcher() {
  const { data: savedSkills } = useSkills();
  const setSkills = useSetSkills();
  const match = usePurposeMatch();
  
  const [skills, setLocalSkills] = useState<string[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    if (savedSkills) {
      setLocalSkills(savedSkills.map((s: any) => s.skill));
    }
  }, [savedSkills]);

  const handleAdd = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim() && skills.length < 3) {
      const newSkills = [...skills, input.trim()];
      setLocalSkills(newSkills);
      setInput("");
      setSkills.mutate(newSkills);
    }
  };

  const removeSkill = (index: number) => {
    const newSkills = skills.filter((_, i) => i !== index);
    setLocalSkills(newSkills);
    setSkills.mutate(newSkills);
  };

  return (
    <PageTransition className="max-w-4xl text-center">
      <div className="py-12">
        <div className="w-20 h-20 bg-primary/10 text-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
          <Compass className="w-10 h-10" />
        </div>
        <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4">Find Your Purpose</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Meaningful contribution reduces loneliness and builds resilience. Tell us what you're good at, and we'll suggest ways to help others.
        </p>

        <div className="max-w-md mx-auto mt-12 mb-16">
          <div className="bg-card rounded-3xl p-4 shadow-xl shadow-black/5 border border-border/50 text-left">
            <label className="text-sm font-bold ml-2 mb-3 block">Enter up to 3 skills (Press Enter)</label>
            <Input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleAdd}
              disabled={skills.length >= 3}
              placeholder={skills.length >= 3 ? "Max skills reached" : "e.g. Teaching, Cooking, Coding..."}
              className="h-14 rounded-2xl bg-secondary/50 border-transparent px-6 text-lg mb-4"
            />
            
            <div className="flex flex-wrap gap-2 px-2">
              <AnimatePresence>
                {skills.map((skill, i) => (
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    key={i} 
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-md"
                  >
                    {skill}
                    <button onClick={() => removeSkill(i)} className="hover:bg-black/20 rounded-full p-0.5 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {skills.length === 0 && <span className="text-sm text-muted-foreground italic px-2 py-2">No skills added yet...</span>}
            </div>
          </div>
          
          <Button 
            size="lg"
            className="w-full h-14 rounded-2xl text-lg font-bold mt-6 shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all"
            disabled={skills.length === 0 || match.isPending}
            onClick={() => match.mutate()}
          >
            {match.isPending ? <Sparkles className="animate-spin w-5 h-5 mr-2" /> : <HandHeart className="w-5 h-5 mr-2" />}
            {match.isPending ? "Finding Matches..." : "Discover Opportunities"}
          </Button>
        </div>

        <AnimatePresence>
          {match.data && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-primary/5 border border-primary/20 rounded-3xl p-8 md:p-12 text-left max-w-2xl mx-auto shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary/50 to-primary" />
              <h3 className="text-primary font-bold tracking-widest uppercase text-sm mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> AI Suggestion
              </h3>
              <p className="text-2xl font-medium text-foreground leading-relaxed">
                "{match.data.suggestion}"
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </PageTransition>
  );
}
