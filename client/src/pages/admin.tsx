import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/admin/feedback"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/3 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto">
          <Card className="bg-destructive/10">
            <CardContent className="p-6">
              <p className="text-destructive">Error loading feedback data</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { feedbacks, stats } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-3xl font-bold">Feedback Dashboard</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Total Feedback</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Confidence Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <p className="text-3xl font-bold">
                {stats.confidentPercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Learning Rate</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <p className="text-3xl font-bold">
                {stats.learnedNewPercentage.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4">
              <CardTitle className="text-lg">Avg Chat Duration</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 px-4 pb-4">
              <p className="text-3xl font-bold">
                {Math.round(stats.averageDuration / 60)}m
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {feedbacks.map((feedback: any) => (
                <Card key={feedback.id} className="bg-muted/50">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{feedback.user.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {feedback.user.email}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(feedback.createdAt), "PPp")}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 py-2">
                      <div>
                        <p className="text-sm font-medium">Confident</p>
                        <p>{feedback.isConfident ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Learned New</p>
                        <p>{feedback.learnedNew ? "Yes" : "No"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Chat Duration</p>
                        <p>{Math.round(feedback.chatDuration / 60)}m</p>
                      </div>
                    </div>

                    {feedback.conversation && (
                      <div>
                        <p className="text-sm font-medium">Feedback</p>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                          {feedback.conversation}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
