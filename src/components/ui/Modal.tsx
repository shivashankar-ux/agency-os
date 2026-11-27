"use client";

import { ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: string; // Tailwind max-w-* class, defaults to max-w-md
}

export function Modal({ open, onClose, title, children, footer, maxWidth = "max-w-md" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-neutral-900 border border-neutral-800 rounded-xl w-full ${maxWidth} p-6 max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-800">
            <h2 className="text-white font-semibold text-base">{title}</h2>
            <button onClick={onClose} className="text-neutral-500 hover:text-white" aria-label="Close">
              <X size={18} />
            </button>
          </div>
        )}
        {children}
        {footer && <div className="mt-5 pt-4 border-t border-neutral-800">{footer}</div>}
      </div>
    </div>
  );
}

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  side?: "left" | "right";
}

export function Drawer({ open, onClose, title, children, side = "right" }: DrawerProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            initial={{ x: side === "right" ? "100%" : "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: side === "right" ? "100%" : "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className={`fixed top-0 ${side === "right" ? "right-0" : "left-0"} bottom-0 z-50 w-full sm:w-96 bg-neutral-900 border-neutral-800 ${
              side === "right" ? "border-l" : "border-r"
            } flex flex-col shadow-2xl`}
          >
            <div className="h-14 px-4 border-b border-neutral-800 flex items-center justify-between shrink-0">
              {title && <h2 className="text-white font-semibold text-sm">{title}</h2>}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors ml-auto"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
