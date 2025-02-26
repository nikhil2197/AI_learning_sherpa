import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { BrainCircuit, ExternalLink, Sparkles, Linkedin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const projects = [
  {
    name: "Auto Insurance Advisor",
    description: "AI-powered insurance recommendation engine",
    url: "https://replit.com/@nikhilramesh/insurance-advisor",
  }
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 space-y-16">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            AI-Powered Tools for Better Decisions
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Helping Indian users make informed choices about insurance and education
          </p>
        </section>

        {/* Mission Statement */}
        <section className="max-w-4xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-6 w-6" />
                Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-lg">
              <p>
                I'm creating a collection of AI-based applications that help Indian users
                navigate complex purchasing decisions for insurance and education.
                My goal is to cut through the marketing noise and provide clear,
                personalized recommendations based on your specific needs.
              </p>
              <p className="text-muted-foreground">
                <Sparkles className="h-4 w-4 inline mr-2" />
                These projects are actively being developed on Replit. While I
                thoroughly test each application, the recommendations are
                continually being refined for accuracy and reliability.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Creator Info */}
        <section className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Creator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                Hey my name is Nikhil Ramesh and this is a site I am using to publicly document my learning journey in building AI tools. My day job lies at the intersection of strategy, ops and product at Openhouse - an early stage educations startup in Bengaluru. Prior to Openhouse I was a management consultant in the US and have earned my Bachelors Degree at Northwestern.
              </p>
              <p>
                My other hobbies involve Food, Sports and Politics.
              </p>
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
            </CardContent>
          </Card>
        </section>

        {/* Live Projects */}
        <section className="w-full space-y-6">
          <h2 className="text-3xl font-bold text-center">Live Projects</h2>
          <Card>
            <CardContent className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Project Use Case</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.name}>
                      <TableCell className="font-medium">{project.name}</TableCell>
                      <TableCell>{project.description}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" asChild>
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                          >
                            Get Started
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>

        {/* Feedback Form */}
        <section className="w-full space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Share Your Details</CardTitle>
              <CardDescription>
                If you use these tools, leave your contact information to help Nikhil gather feedback and improve the experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="your@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="canContact"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            I agree to be contacted for feedback
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Submitting..." : "Submit"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}