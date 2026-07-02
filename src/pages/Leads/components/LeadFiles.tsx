import React from 'react';
import { FileUploadSection } from '../../../shared/components/FileUploadSection';

interface LeadFilesProps {
  leadId: string;
  onFilesChanged?: () => void;
}

export const LeadFiles: React.FC<LeadFilesProps> = ({ leadId, onFilesChanged }) => {
  return (
    <FileUploadSection
      entityId={leadId}
      entityType="lead"
      onFilesChanged={onFilesChanged}
    />
  );
};
