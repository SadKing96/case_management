export type Role = 'SuperUser' | 'Admin' | 'User';

export interface User {
    id: string;
    name: string;
    email: string;
    roles: Role[];
    avatarUrl?: string;
}

export interface Workspace {
    id: string;
    name: string;
    domain: string;
}

export interface Board {
    id: string;
    workspaceId: string;
    name: string;
    slug: string;
    description?: string;
}

export interface Column {
    id: string;
    boardId: string;
    name: string;
    position: number;
    isFinal: boolean;
}

export interface Case {
    id: string;
    boardId: string;
    columnId: string;
    position: number;
    title: string;
    priority?: 'High' | 'Medium' | 'Low';
    type: 'QUOTE' | 'ORDER' | 'SR' | 'QUESTION' | string; // Added type
    quoteId?: string;
    productType?: string;
    specs?: string;
    customerName?: string;
    formPayloadJson: Record<string, any>;
    assigneeId?: string;
    opdsl?: Date;
    createdAt: Date;
    updatedAt: Date;
    closedAt?: Date;
    archivedAt?: Date;
    escalatedToId?: string;
    escalatedFromId?: string;
}

export interface CaseNote {
    id: string;
    caseId: string;
    authorId: string;
    content: string;
    createdAt: Date;
}

export interface CaseEmail {
    id: string;
    caseId: string;
    direction: 'in' | 'out';
    from: string;
    to: string[];
    cc: string[];
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
    messageId?: string;
    inReplyTo?: string;
    receivedAt: Date;
}

export interface CaseAttachment {
    id: string;
    caseId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    blobPath: string;
    uploadedAt: Date;
    uploadedBy?: string;
}

export interface CaseEmailAttachment {
    id: string;
    emailId: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    blobPath: string;
    contentId?: string; // for inline images
}

export interface Rule {
    id: string;
    boardId: string;
    name: string;
    triggerType: string; // e.g., 'EmailReceived', 'CaseMoved'
    conditionJson: Record<string, any>;
    actionJson: Record<string, any>;
    isEnabled: boolean;
}

export interface Team {
    id: string;
    name: string;
    description?: string;
    color: string;
    isActive: boolean;
    members: TeamMember[];
    createdAt: Date;
    updatedAt: Date;
}

export interface TeamMember {
    id: string;
    teamId: string;
    userId: string;
    user: User;
}

export interface AuditLog {
    id: string;
    actorId: string;
    entityType: string;
    entityId: string;
    action: string;
    detailsJson?: Record<string, any>;
    createdAt: Date;
}
