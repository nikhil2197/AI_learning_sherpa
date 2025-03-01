
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";

export default function Logs() {
  const [logFiles, setLogFiles] = useState<string[]>([]);
  const [selectedLog, setSelectedLog] = useState<string>("");
  const [logContent, setLogContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogFiles();
  }, []);

  async function fetchLogFiles() {
    try {
      setLoading(true);
      const response = await apiRequest("GET", "/api/logs");
      const data = await response.json();
      setLogFiles(data.logFiles || []);
      if (data.logFiles && data.logFiles.length > 0) {
        setSelectedLog(data.logFiles[0]);
        await fetchLogContent(data.logFiles[0]);
      }
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({
        title: "Error",
        description: "Failed to fetch log files",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchLogContent(filename: string) {
    try {
      setLoading(true);
      const response = await apiRequest("GET", `/api/logs/${filename}`);
      const text = await response.text();
      setLogContent(text);
    } catch (error) {
      console.error("Error fetching log content:", error);
      toast({
        title: "Error",
        description: "Failed to fetch log content",
        variant: "destructive",
      });
      setLogContent("Error loading log content");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogChange(value: string) {
    setSelectedLog(value);
    await fetchLogContent(value);
  }

  function handleDownload() {
    const blob = new Blob([logContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = selectedLog;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl md:text-2xl">Production Logs</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={fetchLogFiles} disabled={loading}>
                  Refresh
                </Button>
                <Button onClick={handleDownload} disabled={!selectedLog || loading}>
                  Download
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {logFiles.length > 0 ? (
                <>
                  <div className="w-full">
                    <Select value={selectedLog} onValueChange={handleLogChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a log file" />
                      </SelectTrigger>
                      <SelectContent>
                        {logFiles.map((file) => (
                          <SelectItem key={file} value={file}>
                            {file}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="relative mt-4">
                    <pre className="p-4 bg-muted rounded-md text-sm overflow-auto max-h-[60vh] whitespace-pre-wrap">
                      {loading ? "Loading..." : logContent || "No log data available"}
                    </pre>
                  </div>
                </>
              ) : (
                <p>No log files found</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
