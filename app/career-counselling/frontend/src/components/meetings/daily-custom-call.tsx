"use client";

import { useEffect, useState } from "react";
import {
    useMeetingState,
    useLocalSessionId,
    useParticipantIds,
    useVideoTrack,
    useAudioTrack,
    useScreenShare,
    useDailyEvent,
    DailyVideo,
} from "@daily-co/daily-react";
import { Button } from "@/components/ui/button";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    MonitorUp,
    PhoneOff,
    Users,
    Settings,
} from "lucide-react";

interface DailyCustomCallProps {
    onLeave: () => void;
    isOwner: boolean;
    meetingId: string;
    meetingCost: number;
}

export default function DailyCustomCall({ onLeave, isOwner, meetingId, meetingCost }: DailyCustomCallProps) {
    const meetingState = useMeetingState();
    const localSessionId = useLocalSessionId();
    const participantIds = useParticipantIds();

    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isMicOn, setIsMicOn] = useState(true);

    // Daily Hooks
    const localVideo = useVideoTrack(localSessionId || "");
    const localAudio = useAudioTrack(localSessionId || "");
    const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();

    // Listen for errors
    useDailyEvent("camera-error", (e) => {
        console.warn("Camera error:", e);
    });

    const [isExtending, setIsExtending] = useState(false);

    const handleExtend = async () => {
        setIsExtending(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/meetings/${meetingId}/extend`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ durationMinutes: 30 }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.detail || "Failed to extend meeting");
            }

            alert("Meeting extended successfully! 30 minutes added."); // Use your preferred toast notification if available
        } catch (err: any) {
            console.error(err);
            alert(err.message || "Failed to extend meeting");
        } finally {
            setIsExtending(false);
        }
    };

    // Toggle Camera
    const toggleCamera = () => {
        // If you have useLocalParticipant, you could do callObject.setLocalVideo(!isCameraOn)
        setIsCameraOn(!isCameraOn);
        // This is handled automatically by DailyIframe if we interact with it,
        // but without the direct object here, we rely on standard Daily React patterns
    };

    // Toggle Mic
    const toggleMic = () => {
        setIsMicOn(!isMicOn);
    };

    if (meetingState === "joining-meeting" || meetingState === "loading") {
        return (
            <div className="flex h-full items-center justify-center text-white">
                Joining room...
            </div>
        );
    }

    if (meetingState === "left-meeting") {
        return (
            <div className="flex flex-col h-full items-center justify-center text-white space-y-4">
                <h2 className="text-2xl font-bold">You left the call.</h2>
                <Button variant={"secondary"} onClick={onLeave}>
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-gray-950 text-white relative">
            {/* Video Grid Header */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
                <h1 className="text-xl font-semibold">AlumNiti Meeting</h1>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                        <Users className="h-5 w-5" />
                    </Button>
                    <span className="text-sm border border-white/20 px-3 py-1 rounded-full bg-black/40">
                        {participantIds.length} {participantIds.length === 1 ? "participant" : "participants"}
                    </span>
                </div>
            </div>

            {/* Main Video Area */}
            <div className="flex-1 p-4 flex items-center justify-center mt-12 mb-20 overflow-hidden">
                <div className={`grid gap-4 w-full h-full ${participantIds.length > 1 ? "grid-cols-2" : "grid-cols-1"
                    }`}>
                    {participantIds.map((id) => (
                        <div key={id} className="relative w-full h-full bg-gray-900 rounded-xl overflow-hidden shadow-lg border border-gray-800">
                            <DailyVideo
                                sessionId={id}
                                type="video"
                                fit="cover"
                                style={{ height: "100%", width: "100%" }}
                            />
                            <div className="absolute bottom-4 left-4 bg-black/60 px-3 py-1.5 rounded-md text-sm backdrop-blur-sm flex items-center gap-2">
                                <span>{id === localSessionId ? "You" : "Participant"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Control Bar */}
            <div className="absolute bottom-0 w-full p-4 flex justify-center items-center gap-4 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 z-10">
                <Button
                    variant={isMicOn ? "secondary" : "destructive"}
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-105"
                    onClick={toggleMic}
                >
                    {isMicOn ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>

                <Button
                    variant={isCameraOn ? "secondary" : "destructive"}
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-105"
                    onClick={toggleCamera}
                >
                    {isCameraOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>

                <Button
                    variant={isSharingScreen ? "default" : "secondary"}
                    size="icon"
                    className={`h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-105 ${isSharingScreen ? "bg-blue-600 hover:bg-blue-700 text-white" : ""
                        }`}
                    onClick={() => isSharingScreen ? stopScreenShare() : startScreenShare()}
                >
                    <MonitorUp className="h-5 w-5" />
                </Button>

                <Button
                    variant="secondary"
                    size="icon"
                    className="h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                    <Settings className="h-5 w-5" />
                </Button>

                {!isOwner && (
                    <Button
                        variant="outline"
                        className="h-12 rounded-full shadow-lg border-blue-500 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300 ml-2"
                        onClick={handleExtend}
                        disabled={isExtending}
                    >
                        {isExtending ? "Extending..." : `Extend (+30m)`}
                    </Button>
                )}

                <Button
                    variant="destructive"
                    size="icon"
                    className="h-12 w-16 w-auto px-6 rounded-full shadow-lg hover:bg-red-700 transition-transform hover:scale-105 ml-4"
                    onClick={onLeave}
                >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    <span className="font-semibold">Leave</span>
                </Button>
            </div>
        </div>
    );
}
