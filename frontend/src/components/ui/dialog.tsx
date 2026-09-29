'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
export function Drawer({ open, onOpenChange, title, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; children: React.ReactNode }) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}><Dialog.Portal><Dialog.Overlay className="drawer-overlay"/><Dialog.Content className="drawer"><div className="section-heading"><Dialog.Title>{title}</Dialog.Title><Dialog.Close aria-label="Close evidence" className="icon-button"><X size={20}/></Dialog.Close></div><Dialog.Description className="muted">Trace each value to its source and extraction record.</Dialog.Description>{children}</Dialog.Content></Dialog.Portal></Dialog.Root>;
}
