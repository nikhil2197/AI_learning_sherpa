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
import { useToast } from "@/hooks/use-toast";
import { insertFeedbackSchema, type InsertFeedback } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

export default function Feedback() {
  const { toast } = useToast();

  // Calculate chat duration
  const chatStartTime = parseInt(sessionStorage.getItem('chatStartTime') || '0');
  const chatDuration = chatStartTime ? Math.floor((Date.now() - chatStartTime) / 1000) : 0;
  const lastRecommendation = sessionStorage.getItem('lastRecommendation') || '';

  const form = useForm<InsertFeedback>({
    resolver: zodResolver(insertFeedbackSchema),
    defaultValues: {
      isConfident: false,
      learnedNew: false,
      conversation: "",
      lastRecommendation,
      chatDuration,
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: InsertFeedback) => {
      await apiRequest("POST", "/api/feedback", data);
    },
    onSuccess: () => {
      toast({
        title: "Thank you for your feedback!",
        description: "Your responses help us improve the service.",
      });
      form.reset();
      // Clear session storage
      sessionStorage.removeItem('chatStartTime');
      sessionStorage.removeItem('lastRecommendation');
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
              <CardTitle className="text-xl md:text-2xl">Your Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-8 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Your Recommendation:</h3>
                {lastRecommendation ? (
                  <p className="text-muted-foreground">{lastRecommendation}</p>
                ) : (
                  <p className="text-muted-foreground italic">
                    It seems you ended the chat before we could provide a detailed recommendation. 
                    For the best insurance advice, we recommend having a complete conversation with our AI advisor.
                  </p>
                )}
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                  className="space-y-6"
                >
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
                            Do you feel confident that the recommendation is suitable for you?
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
                            Did you learn something new by using this?
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
                        <FormLabel>How can we improve this service?</FormLabel>
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