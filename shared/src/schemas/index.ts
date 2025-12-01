/**
 * Zod schemas for runtime validation
 * Based on design.md Data Models section
 */

import { z } from 'zod';

// User schemas
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  password_hash: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export const UserPublicSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// Project schemas
export const ProjectSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  working_directory: z.string().min(1).max(1024),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// Agent schemas
export const AgentSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  system_prompt: z.string().max(10000), // Max 10000 chars as per design.md
  session_id: z.string().nullable(),
  linked_md_files: z.array(z.string()),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// Agent Session schema
export const AgentSessionSchema = z.object({
  id: z.string().uuid(),
  agent_id: z.string().uuid(),
  cli_session_id: z.string(),
  total_input_tokens: z.number().int().min(0),
  total_output_tokens: z.number().int().min(0),
  total_cost_usd: z.number().min(0),
  created_at: z.coerce.date(),
  ended_at: z.coerce.date().nullable(),
});

// Token Usage schema
export const TokenUsageSchema = z.object({
  input_tokens: z.number().int().min(0),
  output_tokens: z.number().int().min(0),
  cache_creation_input_tokens: z.number().int().min(0).optional(),
  cache_read_input_tokens: z.number().int().min(0).optional(),
});

// Context Usage schema
export const ContextUsageSchema = z.object({
  totalTokens: z.number().int().min(0),
  inputTokens: z.number().int().min(0),
  outputTokens: z.number().int().min(0),
  warningThreshold: z.number().int().min(0).default(120000),
});

// Message schema
export const MessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.coerce.date(),
  usage: TokenUsageSchema.optional(),
  toolUse: z.array(z.object({
    id: z.string(),
    name: z.string(),
    input: z.record(z.unknown()),
    output: z.string().optional(),
    status: z.enum(['pending', 'completed', 'error']),
  })).optional(),
});

// Tab data schema
export const TabDataSchema = z.object({
  id: z.string(),
  type: z.enum(['chat', 'doc']),
  title: z.string(),
  agentId: z.string().optional(),
  filePath: z.string().optional(),
});

// Directory item schema
export const DirectoryItemSchema = z.object({
  name: z.string(),
  path: z.string(),
  isDirectory: z.boolean(),
  size: z.number().optional(),
  modifiedAt: z.coerce.date().optional(),
});

// Auth request schemas
export const AuthRegisterRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const AuthLoginRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const AuthResponseSchema = z.object({
  user: UserPublicSchema,
  token: z.string(),
});

// Project request schemas
export const CreateProjectRequestSchema = z.object({
  working_directory: z.string()
    .min(1, 'Working directory is required')
    .max(1024, 'Path too long')
    .refine((path) => path.startsWith('/'), 'Path must be absolute'),
});

// Agent request schemas
export const UpdateAgentRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  system_prompt: z.string().max(10000, 'System prompt cannot exceed 10000 characters').optional(),
  linked_md_files: z.array(z.string()).optional(),
});

export const CreateAgentRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  system_prompt: z.string().max(10000, 'System prompt cannot exceed 10000 characters'),
});

// Browse response schema
export const BrowseResponseSchema = z.object({
  currentPath: z.string(),
  parentPath: z.string().nullable(),
  items: z.array(DirectoryItemSchema),
});

// WebSocket message schemas
export const QueryMessageSchema = z.object({
  type: z.literal('query'),
  prompt: z.string().min(1),
  sessionId: z.string(),
  agentId: z.string().uuid(),
  projectId: z.string().uuid(),
});

export const ConnectedMessageSchema = z.object({
  type: z.literal('connected'),
  sessionId: z.string(),
  model: z.string(),
  cwd: z.string(),
  claudeSessionId: z.string(),
});

export const StreamMessageSchema = z.object({
  type: z.literal('stream'),
  content: z.object({
    type: z.literal('assistant'),
    message: z.object({
      content: z.string(),
      id: z.string(),
      usage: TokenUsageSchema.optional(),
    }),
  }),
  sessionId: z.string(),
});

export const CompleteMessageSchema = z.object({
  type: z.literal('complete'),
  result: z.unknown(),
  usage: TokenUsageSchema,
  cost: z.number(),
  duration: z.number(),
  numTurns: z.number().int(),
  isError: z.boolean(),
  sessionId: z.string(),
});

export const ErrorMessageSchema = z.object({
  type: z.literal('error'),
  error: z.string(),
  code: z.string(),
  sessionId: z.string(),
});

export const WebSocketMessageSchema = z.discriminatedUnion('type', [
  QueryMessageSchema,
  ConnectedMessageSchema,
  StreamMessageSchema,
  CompleteMessageSchema,
  ErrorMessageSchema,
]);

// Type exports from schemas
export type UserSchemaType = z.infer<typeof UserSchema>;
export type UserPublicSchemaType = z.infer<typeof UserPublicSchema>;
export type ProjectSchemaType = z.infer<typeof ProjectSchema>;
export type AgentSchemaType = z.infer<typeof AgentSchema>;
export type AgentSessionSchemaType = z.infer<typeof AgentSessionSchema>;
export type TokenUsageSchemaType = z.infer<typeof TokenUsageSchema>;
export type ContextUsageSchemaType = z.infer<typeof ContextUsageSchema>;
export type MessageSchemaType = z.infer<typeof MessageSchema>;
export type TabDataSchemaType = z.infer<typeof TabDataSchema>;
export type DirectoryItemSchemaType = z.infer<typeof DirectoryItemSchema>;
export type WebSocketMessageSchemaType = z.infer<typeof WebSocketMessageSchema>;
