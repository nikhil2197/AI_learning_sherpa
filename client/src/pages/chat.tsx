import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { Send, Loader2, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface Message {
  type: 'user' | 'bot';
  message: string;
  timestamp: number;
}

const INITIAL_MESSAGE = {
  type: 'bot' as const,
  message: "Hi there! I'm your friendly insurance advisor. I'd like to help you build the right coverage plan and find the best insurance providers for your needs. If you already know exactly what coverage you want, we can jump straight to comparing providers - though I recommend going through the full process to ensure you're getting exactly what you need.\n\nWhere are you in your insurance journey?\n1. Looking to find the right coverage and insurance provider\n2. Already know what coverage you need and just want to compare providers",
  timestamp: Date.now()
};

export default function Chat() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Store chat start time
  useEffect(() => {
    sessionStorage.setItem('chatStartTime', Date.now().toString());
  }, []);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      const { scrollHeight, clientHeight } = chatContainerRef.current;
      chatContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat", { 
        message,
        context: messages.slice(-5) // Send last 5 messages for context
      });
      return response.json();
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { 
        type: 'bot', 
        message: data.message,
        timestamp: Date.now()
      }]);
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please try again.",
        variant: "destructive",
      });
      console.error('Chat error:', error);
    },
  });

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    // Add user message to chat
    const newMessage = {
      type: 'user' as const,
      message: input.trim(),
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, newMessage]);

    // Clear input and scroll
    setInput('');
    scrollToBottom();

    // Send to API
    chatMutation.mutate(newMessage.message);
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
    }).format(timestamp);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <div className="h-16 px-4 py-2 border-b border-border bg-background/95 backdrop-blur">
        {/* Top navigation bar without End Conversation button */}
      </div>

      {/* Chat Area */}
      <div className="flex-1 relative">
        {/* Messages */}
        <div 
          ref={chatContainerRef}
          className="h-[calc(100vh-8rem)] overflow-y-auto p-4 pb-32"
        >
          <div className="max-w-2xl mx-auto space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`
                    rounded-2xl px-4 py-2 max-w-[80%] shadow-sm whitespace-pre-wrap
                    ${msg.type === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted rounded-bl-sm'
                    }
                    transition-all duration-200 ease-in-out
                    hover:shadow-md
                  `}
                >
                  <div className="flex flex-col gap-1">
                    <div>{msg.message}</div>
                    <div className={`text-xs ${msg.type === 'user' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {chatMutation.isPending && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl px-4 py-2 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <form onSubmit={sendMessage} className="max-w-2xl mx-auto flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={chatMutation.isPending}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={chatMutation.isPending || !input.trim()}
              size="icon"
              className="transition-transform hover:scale-[0.98] active:scale-[0.97]"
            >
              {chatMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
          <div className="max-w-2xl mx-auto mt-3">
            <Button
              size="lg"
              onClick={() => setLocation("/feedback")}
              className="w-full h-12 text-lg font-medium transition-transform hover:scale-[0.98] active:scale-[0.97]"
            >
              End Conversation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}