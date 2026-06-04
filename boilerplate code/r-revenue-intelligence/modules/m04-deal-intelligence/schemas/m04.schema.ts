import { z } from 'zod';

// ── Deal MEDDPICC Analysis DTOs ─────────────────────────────────────────────

export const DealMeddpiccCategorySchema = z.enum([
  'metrics',
  'economicBuyer',
  'decisionCriteria',
  'decisionProcess',
  'identifyPain',
  'champion',
]);
export type DealMeddpiccCategory = z.infer<typeof DealMeddpiccCategorySchema>;

export const UpsertDealMeddpiccSchema = z.object({
  dealExternalId: z.string().min(1),
  tenantId:     z.string().min(1).optional(),
  score:        z.number().int().min(0).max(100),
  metrics:      z.string().optional(),
  economicBuyer:z.string().optional(),
  decisionCriteria: z.string().optional(),
  decisionProcess:  z.string().optional(),
  identifyPain: z.string().optional(),
  champion:     z.string().optional(),
  matchedCategories: z.array(DealMeddpiccCategorySchema).default([]),
  contactCount: z.number().int().min(0).default(0),
  aiNextStep:   z.string().optional(),
});
export type UpsertDealMeddpiccDto = z.infer<typeof UpsertDealMeddpiccSchema>;

export const DealMeddpiccResponseSchema = z.object({
  id:               z.string(),
  dealExternalId:   z.string(),
  score:            z.number(),
  metrics:          z.string().nullable(),
  economicBuyer:    z.string().nullable(),
  decisionCriteria: z.string().nullable(),
  decisionProcess:  z.string().nullable(),
  identifyPain:     z.string().nullable(),
  champion:         z.string().nullable(),
  matchedCategories:z.array(z.string()),
  contactCount:     z.number(),
  aiNextStep:       z.string().nullable(),
  createdAt:        z.coerce.date(),
  updatedAt:        z.coerce.date(),
});
export type DealMeddpiccResponse = z.infer<typeof DealMeddpiccResponseSchema>;

// ── Transcript-linked Call for a Deal ───────────────────────────────────────

export const DealCallTranscriptSchema = z.object({
  callId:       z.string(),
  dealId:       z.string(),
  occurredAt:   z.coerce.date(),
  durationSec:  z.number().int().optional(),
  transcriptText:z.string(),
  ownerName:    z.string().optional(),
});
export type DealCallTranscript = z.infer<typeof DealCallTranscriptSchema>;

// ── Enriched Deal (output of controller) ──────────────────────────────────

export const EnrichedDealSchema = z.object({
  dealId:           z.string(),
  dealName:         z.string(),
  amount:           z.number(),
  stage:            z.string(),
  pipeline:         z.string(),
  ownerId:          z.string(),
  ownerName:        z.string(),
  closeDate:        z.string(),
  contacts:         z.number().int(),
  aiScore:          z.number(),
  aiScorePercent:   z.number(),
  meddpiccScore:    z.number(),
  meddpiccPercent:  z.number(),
  playbookScore:    z.number(),
  playbookColor:    z.string(),
  aiSuggestedNextStep:z.string(),
  matchedCategories:z.array(z.string()),
});
export type EnrichedDeal = z.infer<typeof EnrichedDealSchema>;
