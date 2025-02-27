import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { AlertCircle, Send, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

interface Message {
  type: 'user' | 'bot';
  message: string;
}

export default function Chat() {
  const [, setLocation] = useLocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnecting(false);
      setError(null);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, { type: data.type, message: data.message }]);
    };

    ws.onerror = () => {
      setError('Failed to connect to the chat service');
      setIsConnecting(false);
    };

    ws.onclose = () => {
      setError('Connection to chat service lost');
    };

    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim() || !wsRef.current) return;

    const message = input.trim();
    setMessages(prev => [...prev, { type: 'user', message }]);
    wsRef.current.send(message);
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col max-w-3xl">
        <Card className="flex-1 mb-8">
          <CardContent className="p-6 h-[70vh] flex flex-col">
            {isConnecting ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <p>Connecting to advisor...</p>
                </div>
              </div>
            ) : error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${
                        msg.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
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
                <div className="mt-4 flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button onClick={sendMessage} disabled={!input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setLocation("/feedback")}
            className="px-8 py-6 text-lg"
          >
            End Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}