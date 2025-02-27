import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";

export default function Chat() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Get current user session
  const { data: user, isLoading: isLoadingUser, isError: isUserError } = useQuery({
    queryKey: ['/api/current-user'],
  });

  useEffect(() => {
    // Store chat start time when component mounts
    sessionStorage.setItem('chatStartTime', Date.now().toString());
  }, []);

  // Redirect to get-started if no authenticated user
  useEffect(() => {
    if (!isLoadingUser && !user) {
      setLocation("/get-started");
    }
  }, [user, isLoadingUser, setLocation]);

  // Construct iframe URL with user context
  const chatUrl = new URL('https://insurance-wizard-rameshnikhil21.replit.app');
  if (user?.id) chatUrl.searchParams.append('userId', user.id.toString());
  if (user?.email) chatUrl.searchParams.append('email', encodeURIComponent(user.email));

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <div className="h-16 px-4 py-2 border-b border-border bg-background/95 backdrop-blur">
        <Button
          size="lg"
          onClick={() => setLocation("/feedback")}
          className="w-full h-12 text-lg font-medium"
        >
          End Conversation
        </Button>
      </div>

      {/* Main chat area */}
      <div className="flex-1 relative">
        {(error || isUserError) && (
          <Alert variant="destructive" className="m-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load the chat interface. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {(isLoading || isLoadingUser) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Loading chat interface...</p>
            </div>
          </div>
        )}

        {user && (
          <iframe
            src={chatUrl.toString()}
            className="w-full h-[calc(100vh-4rem)]"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError(true);
              setIsLoading(false);
            }}
            // Only allow clipboard access
            allow="clipboard-write"
          />
        )}
      </div>
    </div>
  );
}