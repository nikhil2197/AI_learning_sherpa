import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import {
  BrainCircuit,
  ExternalLink,
  Sparkles,
  Linkedin,
  AlertCircle,
} from "lucide-react";
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

export default function Home() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16 space-y-8 md:space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent leading-tight">
            Clear Choice AI: AI Courses
          </h1>
        </section>

        {/* What AI Does */}
        <section className="max-w-2xl mx-auto px-4">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">
                What do we do?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p>
                We're focused on helping you learn AI in a way that fits{" "}
                <em>your life</em> — considering your schedule, goals, and
                learning style. Here's how:
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <span className="font-semibold text-primary">1</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Personal Assessment</h3>
                    <p className="text-muted-foreground">
                      Understanding your background, goals, and daily
                      commitments
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <span className="font-semibold text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Learning Plan Creation</h3>
                    <p className="text-muted-foreground">
                      Crafting a customized study plan that fits your schedule
                      and learning style
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-primary/10 rounded-full p-2 mt-0.5">
                    <span className="font-semibold text-primary">3</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Resource Matching</h3>
                    <p className="text-muted-foreground">
                      Recommending the right learning resources based on your
                      goals and budget constraints
                    </p>
                  </div>
                </div>
              </div>

              {/* Info about time estimate */}
              <Card className="shadow-sm bg-primary/10 mt-6">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 text-sm">
                    <BrainCircuit className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                    <p>
                      <span className="font-medium">Please note:</span> Our AI
                      coach will spend about 5-10 minutes understanding your
                      background and goals to create a personalized learning
                      plan. Be prepared to share your schedule and learning
                      preferences!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <Card className="shadow-sm bg-muted">
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <p>
                      Our AI coach provides personalized recommendations based
                      on your input. While thoroughly tested, please use your
                      judgment when making final decisions about your learning
                      journey.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full mt-4"
                onClick={() => setLocation("/chat")}
              >
                Talk to AI Learning Coach
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
                Hey my name is Nikhil Ramesh and this is a site I am using to
                publicly document my learning journey in building AI tools. My
                day job lies at the intersection of strategy, ops and product at
                Openhouse - an early stage education startup in Bengaluru. Prior
                to Openhouse I was a management consultant in the US and have
                earned my Bachelors Degree at Northwestern.
              </p>
              <p>My other hobbies involve Food, Sports and Politics.</p>
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
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
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
