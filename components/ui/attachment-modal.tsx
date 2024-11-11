'use client';

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FileText } from 'lucide-react';

interface AttachmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachments: string[];
}

export function AttachmentModal({ isOpen, onClose, attachments }: AttachmentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="View Attachments"
    >
      <div className="space-y-4">
        {attachments.map((url, index) => (
          <div key={index} className="border rounded-lg p-4">
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-blue-500 hover:underline"
            >
              <FileText className="h-4 w-4" />
              Download Attachment {index + 1}
            </a>
          </div>
        ))}
      </div>
    </Modal>
  );
} 