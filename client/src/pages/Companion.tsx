import { PageTransition } from "@/components/layout/PageTransition";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Bot, User } from "lucide-react";
import { useChatInteract } from "@/hooks/use-chat";

export default function Companion() {
  const [messages, setMessages] = useState<{role: 'user' | 'ai', content: string}[]>([
    { role: 'ai', content: "Hello! I'm here to support you today. How are you feeling?" }
  ]);
  const [input, setInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const interact = useChatInteract();

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, interact.isPending]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");

    interact.mutate(userMsg, {
      onSuccess: (data) => {
        setMessages(prev => [...prev, { role: 'ai', content: data.response }]);
      }
    });
  };

  return (
    <PageTransition className="h-[calc(100vh-4rem)] flex flex-col pt-4 pb-0 max-w-4xl mx-auto px-4">
      <header className="mb-4 flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/20 text-primary rounded-2xl flex items-center justify-center">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Companion</h1>
          <p className="text-sm text-muted-foreground">Supportive, motivational guidance.</p>
        </div>
      </header>

      <div className="flex-1 bg-card rounded-3xl border border-border/50 shadow-sm overflow-hidden flex flex-col mb-6">
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1
                ${msg.role === 'ai' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'}`}>
                {msg.role === 'ai' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm text-[15px] leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                  : 'bg-secondary text-foreground rounded-tl-sm border border-border/30'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {interact.isPending && (
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 mt-1">
                <Bot size={16} />
              </div>
              <div className="bg-secondary rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{animationDelay: '0ms'}}></div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{animationDelay: '150ms'}}></div>
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{animationDelay: '300ms'}}></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-4 bg-background border-t border-border/50">
          <div className="relative flex items-end gap-2">
            <Textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              className="resize-none min-h-[56px] max-h-32 rounded-2xl bg-secondary/50 border-transparent focus:bg-background pr-14"
            />
            <Button 
              size="icon" 
              className="absolute right-2 bottom-2 w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 hover:scale-105 transition-all shadow-md"
              onClick={handleSend}
              disabled={!input.trim() || interact.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-center text-[11px] text-muted-foreground mt-3">
            AI can make mistakes. Consider verifying important wellbeing advice.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
