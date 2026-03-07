"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import DailyIframe, { DailyCall } from "@daily-co/daily-js";
import { DailyProvider } from "@daily-co/daily-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import DailyCustomCall from "@/components/meetings/daily-custom-call";

export default function MeetingPage() {
    const params = useParams();
    const meetingId = params?.id as string;
    const router = useRouter();
    const { user, isAuthenticated, loading: authLoading } = useAuth();

    const [callObject, setCallObject] = useState<DailyCall | null>(null);
    const [meetingUrl, setMeetingUrl] = useState<string | null>(null);
    const [meetingToken, setMeetingToken] = useState<string | null>(null);
    const [isOwner, setIsOwner] = useState<boolean>(false);

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const initRef = useRef(false);
    const callRef = useRef<DailyCall | null>(null);

    // Leave call and clean up
    const handleLeave = useCallback(async () => {
        if (callRef.current) {
            await callRef.current.leave();
            await callRef.current.destroy();
            callRef.current = null;
            setCallObject(null);
        }
        router.push("/dashboard");
    }, [router]);

    useEffect(() => {
        // Wait for auth to finish
        if (authLoading) return;

        if (!isAuthenticated) {
            router.push(`/login?redirect=/meeting/${meetingId}`);
            return;
        }

        // Prevent double-init from React StrictMode / hot reload
        if (initRef.current) return;
        initRef.current = true;

        const initMeeting = async () => {
            setIsLoading(true);
            try {
                const token = localStorage.getItem("token");
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

                // Get meeting token and URL safely
                const response = await fetch(`${apiUrl}/api/meetings/${meetingId}/token`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    let errMessage = "Failed to join meeting";
                    try {
                        const err = await response.json();
                        errMessage = err.detail || errMessage;
                    } catch (e) {
                        // Text error fallback
                    }
                    throw new Error(errMessage);
                }

                const data = await response.json();

                if (!data.roomUrl) {
                    throw new Error("No meeting room available");
                }

                setMeetingUrl(data.roomUrl);
                setMeetingToken(data.token);
                setIsOwner(data.isOwner);

                // Initialize Daily call object
                const newCallObject = DailyIframe.createCallObject({
                    videoSource: true,
                    audioSource: true,
                });

                callRef.current = newCallObject;
                setCallObject(newCallObject);
            } catch (err) {
                console.error("Error joining meeting:", err);
                setError(err instanceof Error ? err.message : "Failed to join room");
            } finally {
                setIsLoading(false);
            }
        };

        if (meetingId) {
            initMeeting();
        }

        // Cleanup on unmount
        return () => {
            if (callRef.current) {
                callRef.current.leave().then(() => callRef.current?.destroy());
                callRef.current = null;
            }
            initRef.current = false;
        };
    }, [meetingId, isAuthenticated, authLoading]);

    // Handle actual joining of the meeting only after callObject is ready
    useEffect(() => {
        if (callObject && meetingUrl) {
            callObject.join({
                url: meetingUrl,
                token: meetingToken || undefined,
            }).catch(err => {
                console.error("Failed to join call:", err);
                setError("Failed to connect to video room");
            });
        }
    }, [callObject, meetingUrl, meetingToken]);

    if (authLoading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">Connecting to meeting...</h2>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
                <Card className="max-w-md w-full p-6 space-y-4">
                    <div className="flex items-center gap-3 text-red-600 mb-2">
                        <AlertCircle className="h-8 w-8" />
                        <h2 className="text-2xl font-bold">Error Joining</h2>
                    </div>
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={() => router.push("/dashboard")} className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Return to Dashboard
                    </Button>
                </Card>
            </div>
        );
    }

    if (!callObject) {
        return null;
    }

    // Once call object is ready, wrap our custom UI in DailyProvider
    return (
        <div className="h-screen bg-gray-950 flex flex-col">
            <DailyProvider callObject={callObject}>
                <DailyCustomCall
                    onLeave={handleLeave}
                    isOwner={isOwner}
                    meetingId={meetingId}
                    meetingCost={0}
                />
            </DailyProvider>
        </div>
    );
}
