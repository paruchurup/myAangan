// vault.model.ts
export type DocumentType      = 'SOCIETY' | 'NOC' | 'MAINTENANCE';
export type NocRequestStatus  = 'PENDING' | 'FULFILLED' | 'REJECTED';

export interface VaultDocument {
  id: number;
  type: DocumentType;
  title: string;
  description: string;
  filePath: string;
  fileFormat: string;
  resident: any;
  uploadedBy: any;
  expiryDate: string;
  active: boolean;
  createdAt: string;
}

export interface NocRequest {
  id: number;
  resident: any;
  purpose: string;
  details: string;
  status: NocRequestStatus;
  rejectionReason: string;
  handledBy: any;
  createdAt: string;
}

export const DOC_TYPE_CONFIG: Record<DocumentType, { label: string; icon: string; color: string; bg: string }> = {
  SOCIETY:     { label: 'Society Docs',  icon: '🏛️', color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
  NOC:         { label: 'NOC / Certs',   icon: '📜', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
  MAINTENANCE: { label: 'Maintenance',   icon: '🔧', color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
};

export const FORMAT_ICONS: Record<string, string> = {
  PDF: '📄', JPG: '🖼️', PNG: '🖼️', DOCX: '📝'
};
