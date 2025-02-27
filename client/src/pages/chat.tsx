import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Chat() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // Store chat start time when component mounts
    sessionStorage.setItem('chatStartTime', Date.now().toString());
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top Navigation */}
      <div className="h-16 px-4 py-2 border-b border-border bg-background/95 backdrop-blur-md">
        <Button
          size="lg"
          onClick={() => setLocation("/feedback")}
          className="w-full h-12 text-lg font-medium transition-transform hover:scale-[0.98] active:scale-[0.97]"
        >
          End Conversation
        </Button>
      </div>

      {/* Main chat area with iframe */}
      <div className="flex-1 relative">
        {error && (
          <Alert variant="destructive" className="absolute top-4 left-4 right-4 z-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Unable to load the insurance advisor. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-40">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Loading insurance advisor...</p>
            </div>
          </div>
        )}

        {/* Chat iframe wrapper - adjusts padding based on screen size */}
        <div className="absolute inset-0 md:p-2">
          <iframe
            src="https://insurance-wizard-rameshnikhil21.replit.app/"
            className="w-full h-full rounded-none md:rounded-lg border-0 md:border md:border-border transition-all duration-200"
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setError(true);
              setIsLoading(false);
            }}
          />
        </div>
      </div>
    </div>
  );
}