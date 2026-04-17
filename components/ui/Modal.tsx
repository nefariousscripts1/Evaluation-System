import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="app-modal-overlay">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="app-modal-card relative max-w-lg text-left">
        <div className="border-b border-[#ede8f7] px-6 py-5">
          <h3 className="text-xl font-bold text-[#24135f]">{title}</h3>
        </div>
        <div className="px-6 py-6">
          <div className="mt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
