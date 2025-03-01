import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import * as z from "zod";
import { apiRequest } from "@/lib/queryClient";

// Combine user info with feedback fields
interface FeedbackForm extends InsertUser {
  isConfident: boolean;
  learnedNew: boolean | null; //Allow null for backward compatibility
  wasFaster: boolean; //New field
  conversation: string;
}

export default function Feedback() {
  const { toast } = useToast();

  // Calculate chat duration
  const chatStartTime = parseInt(
    sessionStorage.getItem("chatStartTime") || "0",
  );
  const chatDuration = chatStartTime
    ? Math.floor((Date.now() - chatStartTime) / 1000)
    : 0;

  const form = useForm<FeedbackForm>({
    resolver: zodResolver(
      insertUserSchema.extend({
        isConfident: z.boolean().default(false),
        learnedNew: z.boolean().nullable().default(null), //Allow null for backward compatibility
        wasFaster: z.boolean().default(false), //New field
        conversation: z.string().optional(),
      }),
    ),
    defaultValues: {
      name: "",
      email: "",
      whatsappNumber: "",
      isConfident: false,
      learnedNew: null, //Allow null for backward compatibility
      wasFaster: false, //New field
      conversation: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FeedbackForm) => {
      // First create user
      const userResponse = await apiRequest("POST", "/api/users", {
        name: data.name,
        email: data.email,
        whatsappNumber: data.whatsappNumber,
      });
      const user = await userResponse.json();

      // Then create feedback with user ID
      await apiRequest("POST", "/api/feedback", {
        userId: user.id,
        isConfident: data.isConfident,
        learnedNew: data.learnedNew, // Preserve field for backward compatibility
        wasFaster: data.wasFaster, //New field
        conversation: data.conversation,
        chatDuration,
      });
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your feedback!",
        description: "Your responses help us improve the service.",
      });
      form.reset();
      // Clear session storage
      sessionStorage.removeItem("chatStartTime");
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
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-2xl mx-auto space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl">
                Your Feedback on AI Learning Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                  className="space-y-6"
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
                    name="whatsappNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isConfident"
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
                            Do you feel confident about implementing the
                            suggested learning plan?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="learnedNew"
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
                            Did you gain clarity about your AI learning journey
                            through this conversation?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="wasFaster"
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
                            Was this conversation a faster and/or easier way to
                            find the desired courses?
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conversation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          How can we improve this learning guidance service?
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share your suggestions for improvement..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={mutation.isPending}
                  >
                    {mutation.isPending ? "Submitting..." : "Submit Feedback"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
