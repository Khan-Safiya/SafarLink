import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ShareTrackingWidget() {
    const [copied, setCopied] = useState(false);
    const trackingLink = "https://safarlink.app/track/RIDE-12345";

    const copyToClipboard = () => {
        navigator.clipboard.writeText(trackingLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 border-dashed border-[#111439]/30 text-[#111439] hover:bg-[#111439]/5 dark:border-white/30 dark:text-white dark:hover:bg-white/5">
                    <Share2 className="w-4 h-4" />
                    Share Ride Details
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share Live Tracking</DialogTitle>
                    <DialogDescription>
                        Share this link with trusted contacts. They can track your ride in real-time without the app.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center space-x-2 mt-4">
                    <div className="grid flex-1 gap-2">
                        <Label htmlFor="link" className="sr-only">
                            Link
                        </Label>
                        <Input
                            id="link"
                            defaultValue={trackingLink}
                            readOnly
                        />
                    </div>
                    <Button type="submit" size="sm" className="px-3" onClick={copyToClipboard}>
                        <span className="sr-only">Copy</span>
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                    <Button className="w-full bg-[#25D366] hover:bg-[#128C7E] text-white">
                        Share via WhatsApp
                    </Button>
                    <Button className="w-full bg-[#0088cc] hover:bg-[#0077b5] text-white">
                        Share via Telegram
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
