import{z}from'zod';
export const caseInput=z.object({scope:z.enum(['IDENTITY','BUSINESS','ADDRESS','PORTFOLIO'])});
export const evidenceInput=z.object({label:z.string().min(2).max(120),filename:z.string().min(3).max(180),mimeType:z.enum(['application/pdf','image/jpeg','image/png']),byteSize:z.number().int().positive().max(10*1024*1024)});
export const verificationDecisionInput=z.object({decision:z.enum(['APPROVED','REJECTED','CLARIFICATION_REQUIRED']),reason:z.string().min(10).max(2000),internalNotes:z.string().max(4000).optional(),expiresAt:z.coerce.date().optional()});
export const reportInput=z.object({businessId:z.string().uuid().optional(),type:z.enum(['COPYRIGHT','IMPERSONATION','PRIVACY','FAKE_PORTFOLIO','FRAUD','REVIEW_DISPUTE','OTHER']),subjectType:z.string().min(2).max(60),subjectId:z.string().uuid().optional(),description:z.string().min(30).max(3000)});
export const grievanceInput=z.object({type:z.enum(['PRIVACY','VERIFICATION','MODERATION','SERVICE','OTHER']),subject:z.string().min(5).max(160),description:z.string().min(30).max(4000)});
export const appealInput=z.object({grievanceId:z.string().uuid().optional(),targetType:z.string().min(2).max(60),targetId:z.string().uuid(),grounds:z.string().min(30).max(3000)});
export const trustResolutionInput=z.object({status:z.enum(['REVIEWING','ACTIONED','DISMISSED','CLOSED']),resolution:z.string().min(10).max(2000)});
export const appealDecisionInput=z.object({decision:z.enum(['UPHELD','OVERTURNED','CLOSED']),reason:z.string().min(10).max(2000)});
