import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { ExternalLink, BrainCircuit, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { insertFeedbackSchema, type InsertFeedback } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16 space-y-8 md:space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-tight">
            AI-Powered Personal Space
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Your intelligent digital companion that learns and adapts to create a unique, 
            personalized experience.
          </p>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="shadow-sm">
            <CardHeader>
              <BrainCircuit className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-xl">Adaptive AI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Personalized interactions that learn from our conversations to better 
                understand and assist you.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <Sparkles className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-xl">Dynamic Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Content that evolves based on your interests and engagement patterns.
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm md:col-span-2 lg:col-span-1">
            <CardHeader>
              <ExternalLink className="h-8 w-8 mb-2 text-primary" />
              <CardTitle className="text-xl">Smart Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Intelligent linking of your interests, activities, and goals.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="max-w-2xl mx-auto px-4 text-center">
          <Card className="shadow-sm bg-primary/5">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-semibold mb-4">
                Ready to start your personalized experience?
              </h2>
              <p className="text-muted-foreground mb-6">
                Begin your journey with an AI that understands and adapts to you.
              </p>
              <Button 
                size="lg" 
                className="w-full md:w-auto"
                onClick={() => setLocation("/get-started")}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}