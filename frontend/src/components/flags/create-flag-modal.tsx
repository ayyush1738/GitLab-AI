"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Terminal, ShieldPlus, Loader2, Info } from "lucide-react";


/**
 * 🛡️ Create Flag Modal
 * Connects to FlagService.create_new_flag on the Flask backend.
 * Enforces slug-style keys for consistent SDK access.
 */
export function CreateFlagModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({ name: "", key: "", description: "" });

  const mutation = useMutation({
    mutationFn: async (newFlag: typeof formData) => {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/flags`, newFlag, {
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flags"] });
      setFormData({ name: "", key: "", description: "" });
      onClose();
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || "Failed to initialize feature gate.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.key) return;
    mutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-950 border-slate-800 text-slate-200 sm:max-w-md rounded-[2rem] shadow-2xl shadow-indigo-500/10 p-8">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white uppercase tracking-tight">
            <div className="bg-indigo-600/20 p-2 rounded-lg">
              <ShieldPlus className="text-indigo-500 w-5 h-5" />
            </div>
            Initialize Feature
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Display Name</label>
            <input
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
              placeholder="E.g., Winter Sale Recommendations"
              value={formData.name}
              required
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          {/* Feature Key (Slug) */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Unique Key (SDK Identifier)</label>
            <div className="relative">
              <Terminal className="absolute left-3 top-3.5 w-4 h-4 text-slate-600" />
              <input
                className="w-full bg-slate-900/50 border border-slate-800 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:border-indigo-500 outline-none text-indigo-400 placeholder:text-slate-800"
                placeholder="reco-v1-engine"
                value={formData.key}
                required
                onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s/g, '-') })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Description</label>
            <textarea
              className="w-full h-24 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-sm focus:border-indigo-500 outline-none transition-all resize-none placeholder:text-slate-700"
              placeholder="Briefly describe the purpose of this logic gate for the AI auditor..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Info Card */}
          <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl flex gap-3">
            <Info className="text-indigo-500 w-4 h-4 mt-0.5 shrink-0" />
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Upon initialization, <span className="text-indigo-300 font-bold">GitGuardian AI</span> will register this key across all global environments. All future toggles will be gated by a mandatory Claude 3.5 risk assessment.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              {mutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Initialize with AI Guardrail"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}