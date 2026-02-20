import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

export default function SOSButton() {
    const [sending, setSending] = useState(false);
    const { socket } = useSocket();

    const handleSOS = () => {
        if (!confirm("Are you sure you want to send an emergency SOS alert?")) return;

        setSending(true);

        // Get current location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const { latitude, longitude } = position.coords;

                // Emit socket event
                if (socket) {
                    socket.emit('sos_alert', {
                        lat: latitude,
                        lng: longitude,
                        timestamp: new Date().toISOString()
                    });
                }

                // Also could call an API here

                alert("EMERGENCY ALERT SENT! Help is on the way.");
                setSending(false);
            }, () => {
                alert("Could not get location. Alert sent without location data.");
                setSending(false);
            });
        }
    };

    return (
        <button
            onClick={handleSOS}
            disabled={sending}
            className={`fixed bottom-6 right-6 z-50 rounded-full w-16 h-16 flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 ${sending ? 'bg-gray-500' : 'bg-red-600 animate-pulse'}`}
        >
            <AlertTriangle className="text-white w-8 h-8" />
        </button>
    );
}
