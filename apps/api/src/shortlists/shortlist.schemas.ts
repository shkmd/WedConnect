import { z } from 'zod';
export const createShortlistInput=z.object({name:z.string().min(2).max(120),eventLabel:z.string().max(120).optional(),cityLabel:z.string().max(120).optional()});
export const addItemInput=z.object({businessId:z.string().uuid(),note:z.string().max(500).optional()});
export const compareInput=z.object({businessIds:z.array(z.string().uuid()).min(2).max(4)});
export const createShareInput=z.object({expiresInDays:z.number().int().min(1).max(90).default(30)});
export const createReviewInput=z.object({leadRecipientId:z.string().uuid(),rating:z.number().int().min(1).max(5),title:z.string().min(3).max(120),body:z.string().min(30).max(2000),eventDate:z.coerce.date().optional()});
export const replyInput=z.object({reply:z.string().min(10).max(1200)});
export const moderateReviewInput=z.object({decision:z.enum(['APPROVED','REJECTED','HIDDEN']),reason:z.string().min(5).max(1000).optional()}).refine(v=>v.decision==='APPROVED'||!!v.reason,'A reason is required');
