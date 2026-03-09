import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Heart, Compass, LineChart, MessageCircleHeart } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background overflow-hidden relative selection:bg-primary/30">
      {/* Abstract background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent/30 blur-[120px] pointer-events-none" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm tracking-wide mb-6 inline-block">
              Your Daily Wellbeing Companion
            </span>
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mt-4 mb-6 leading-[1.1]">
              Improve Your Life, <br />
              <span className="text-gradient">One Day at a Time.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Humanity Hub is an AI-powered companion designed to improve human happiness, resilience, and emotional wellbeing through measured, outcome-focused conversations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                size="lg" 
                className="rounded-2xl px-8 h-14 text-lg w-full sm:w-auto shadow-xl shadow-primary/20 hover:shadow-2xl hover:-translate-y-1 transition-all"
                onClick={() => window.location.href = "/api/login"}
              >
                Get Started
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="rounded-2xl px-8 h-14 text-lg w-full sm:w-auto hover:bg-secondary/50"
              >
                Learn More
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left"
          >
            {[
              {
                icon: MessageCircleHeart,
                title: "AI Companion",
                desc: "Motivational and supportive conversations tailored to your emotional state."
              },
              {
                icon: LineChart,
                title: "Track Wellbeing",
                desc: "Measure mood, stress, and habits with beautiful visual insights."
              },
              {
                icon: Compass,
                title: "Find Purpose",
                desc: "Connect your skills with meaningful ways to contribute to your community."
              }
            ].map((feature, i) => (
              <div key={i} className="glass-card p-6 rounded-3xl">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
