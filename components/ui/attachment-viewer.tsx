'use client';

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { FileText, Image as ImageIcon, File } from 'lucide-react';

interface AttachmentViewerProps {
  urls: string[];
  isOpen: boolean;
  onClose: () => void;
}

const getFileIcon = (url: string) => {
  if (url.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return <ImageIcon className="h-5 w-5" />;
  }
  if (url.match(/\.(pdf)$/i)) {
    return <FileText className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
};

export function AttachmentViewer({ urls, isOpen, onClose }: AttachmentViewerProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Attachments"
    >
      <div className="space-y-4">
        {urls.map((url, index) => {
          const isImage = url.match(/\.(jpg|jpeg|png|gif)$/i);
          const fileName = url.split('/').pop()?.split('-')[0] || `Attachment ${index + 1}`;
          
          return (
            <div key={index} className="border rounded-lg p-4">
              {isImage ? (
                <div className="space-y-2">
                  <div className="aspect-video relative rounded-lg overflow-hidden bg-muted">
                    <img 
                      src={url} 
                      alt={fileName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{fileName}</span>
                    <a 
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline text-sm"
                    >
                      View Original
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-2">
                  <div className="flex items-center gap-2">
                    {getFileIcon(url)}
                    <span className="text-sm">{fileName}</span>
                  </div>
                  <a 
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Modal>
  );
} 