"use client";

import { Button } from "@/components/ui/button";
import { useAuthState } from "@/hooks/use-auth";
import { useState } from "react";
import { apiFetch } from "@/lib/api-client";

export function GoogleConnectButton() {
  const { token, user } = useAuthState();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!token || !user?.id) {
      alert("Please login first");
      return;
    }

    setIsConnecting(true);
    try {
      console.log('Fetching OAuth URL...');
      
      // Use the apiFetch utility which handles auth headers automatically
      const data = await apiFetch<{ redirectUrl: string }>("/auth/google/authorize", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('OAuth URL response:', data);
      
      // Redirect to Google OAuth
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        throw new Error('No redirect URL in response');
      }
    } catch (error: any) {
      console.error('Failed to connect Google:', error);
      const errorMessage = error?.message || 'Failed to connect Google account. Please check if the backend is running.';
      alert(errorMessage);
      setIsConnecting(false);
    }
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant="primary"
      className="w-full"
    >
      {isConnecting ? "Connecting..." : "Connect Google Calendar"}
    </Button>
  );
}

