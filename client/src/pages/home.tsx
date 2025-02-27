import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { BrainCircuit, ExternalLink, Sparkles, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { insertFeedbackSchema, type InsertFeedback } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";


const projects = [
  {
    name: "Auto Insurance Advisor",
    description: "AI-powered insurance recommendation engine",
    url: "https://replit.com/@nikhilramesh/insurance-advisor",
  },
];

export default function Home() {
  const { toast } = useToast();
  const form = useForm<InsertFeedback>({
    resolver: zodResolver(insertFeedbackSchema),
    defaultValues: {
      name: "",
      email: "",
      canContact: false,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertFeedback) => {
      await apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      toast({
        title: "Thank you!",
        description: "I'll get back to you soon.",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16 space-y-8 md:space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-tight">
            Clear Choice AI
          </h1>
        </section>

        {/* What AI Does */}
        <section className="max-w-2xl mx-auto px-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">What does the AI do?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p>
                We make your life easier by consolidating all advice in one place, in a way you can actually use it:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <span className="font-semibold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Personal Assessment</h3>
                    <p className="text-muted-foreground">Asks you questions about your car and driving scenarios</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <span className="font-semibold text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Coverage Selection</h3>
                    <p className="text-muted-foreground">Uses that info to guide you through selecting the best coverage for your needs</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <span className="font-semibold text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Provider Recommendation</h3>
                    <p className="text-muted-foreground">Based on your coverage needs and personal situation, recommends the best insurance provider</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-md mt-2">
                <p className="text-sm">
                  We're 100% focused on what's best for <em>you</em> — saving you time and confusion while ensuring you get the right coverage at the best price.
                </p>
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => setLocation("/get-started")}
              >
                Get Started
              </Button>
            </CardContent>
          </Card>
        </section>

        {/* Creator Info */}
        <section className="max-w-2xl mx-auto px-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">The Creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Hey my name is Nikhil Ramesh and this is a site I am using to publicly document my learning journey in building AI tools. My day job lies at the intersection of strategy, ops and product at Openhouse - an early stage education startup in Bengaluru. Prior to Openhouse I was a management consultant in the US and have earned my Bachelors Degree at Northwestern.
              </p>
              <p>
                My other hobbies involve Food, Sports and Politics.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button variant="outline" asChild>
                  <a
                    href="https://www.linkedin.com/in/nikhil2197/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <Linkedin className="h-4 w-4" />
                    Connect with me on LinkedIn
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a
                    href="https://x.com/nikhil2197"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Follow me on Twitter
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}