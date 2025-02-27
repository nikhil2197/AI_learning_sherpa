import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";

export default function Chat() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* AI Chat Frame */}
        <Card className="flex-1 mb-4">
          <iframe
            src="https://insurance-advisor.nikhilramesh.repl.co"
            className="w-full h-full min-h-[600px] rounded-lg border-0"
            title="Insurance Advisor"
          />
        </Card>

        {/* End Conversation Button */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => setLocation("/feedback")}
            className="px-8"
          >
            End Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
