import React from "react";
import ReactDOM from "react-dom/client";
import { Route, Switch } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import App from "./App";
import "./index.css";
import { Toaster } from "./components/ui/toaster";
import { SessionProvider } from "./context/session-context";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <App />
        <Toaster />
      </SessionProvider>
    </QueryClientProvider>
  </React.StrictMode>
);