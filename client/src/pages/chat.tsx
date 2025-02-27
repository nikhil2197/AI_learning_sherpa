import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Chat() {
  const [, setLocation] = useLocation();
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col max-w-5xl">
        {/* AI Chat Frame */}
        <div className="flex-1 mb-8">
          {iframeError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Unable to load the chat interface. Please try refreshing the page.
              </AlertDescription>
            </Alert>
          ) : null}

          <Card className="h-[80vh] relative overflow-hidden">
            <iframe
              src="https://insurance-advisor.nikhilramesh.repl.co"
              className="w-full h-full border-0"
              title="Insurance Advisor"
              onError={() => setIframeError(true)}
            />
          </Card>
        </div>

        {/* End Conversation Button */}
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