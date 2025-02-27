import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col max-w-3xl">
        <Card className="flex-1 mb-8">
          <CardContent className="p-6 h-[70vh] flex flex-col">
            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Unable to load the insurance advisor. Please try refreshing the page.
                </AlertDescription>
              </Alert>
            ) : null}

            <div className="relative flex-1">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <p>Loading insurance advisor...</p>
                  </div>
                </div>
              )}
              <iframe
                src="https://insurance-wizard-rameshnikhil21.replit.app/"
                className="w-full h-full border-0 rounded-lg"
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setError(true);
                  setIsLoading(false);
                }}
              />
            </div>
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