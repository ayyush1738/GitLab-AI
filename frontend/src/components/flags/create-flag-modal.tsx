"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, ShieldPlus } from "lucide-react";

export function CreateFlagModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const [formData, setFormData] = useState({ name: "", key: "", description: "" });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic for calling flag mutation here
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-md rounded-3xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-white">
                        <ShieldPlus className="text-indigo-500" />
                        New Feature Gate
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Flag Name</label> {/* Fixed tag */}
                        <input
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none"
                            placeholder="User Recommendations"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Flag Name</label> {/* Fixed tag */}            <div className="relative">
                            <Terminal className="absolute left-3 top-2.5 w-4 h-4 text-slate-600" />
                            <input
                                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm font-mono focus:border-indigo-500 outline-none text-indigo-400"
                                placeholder="reco-v1"
                                value={formData.key}
                                onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s/g, '-') })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl">
                            Initialize with AI Guardrail
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}