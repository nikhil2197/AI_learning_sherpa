import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { AlertCircle, Send, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

interface Message {
  type: 'user' | 'bot';
  message: string;
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check if user is authenticated
  const { isLoading: isAuthChecking } = useQuery<User>({
    queryKey: ['/api/current-user'],
    retry: false,
    throwOnError: false,
    gcTime: 0,
    staleTime: Infinity,
    select: (data) => data,
    onSettled: (_data, error) => {
      if (error) {
        // Redirect to registration if not authenticated
        setLocation('/get-started');
      }
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isAuthChecking) return; // Don't connect if still checking auth

    // Store chat start time when component mounts
    sessionStorage.setItem('chatStartTime', Date.now().toString());

    // Setup WebSocket connection
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, { type: data.type, message: data.message }]);
      } catch (e) {
        console.error('Failed to parse message:', e);
      }
    };

    ws.onerror = (event) => {
      console.error('WebSocket error:', event);
      setError("Connection error. Please try refreshing the page.");
      setIsConnected(false);
    };

    ws.onclose = () => {
      console.log('WebSocket closed');
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [isAuthChecking]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !wsRef.current || !isConnected) return;

    // Send message
    wsRef.current.send(JSON.stringify({
      type: 'user',
      message: input
    }));

    // Add message to local state
    setMessages(prev => [...prev, { type: 'user', message: input }]);
    setInput('');
  };

  // Show loading state while checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col">
        {/* Chat Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`rounded-lg px-4 py-2 max-w-[80%] ${
                    msg.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input and Buttons */}
        <div className="p-4 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container max-w-3xl mx-auto space-y-4">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={!isConnected}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!isConnected || !input.trim()}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>

            <Button
              size="lg"
              onClick={() => setLocation("/feedback")}
              className="w-full py-6 text-lg"
            >
              End Conversation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}