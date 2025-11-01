// Message types
export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// Response format types
export interface JSONSchemaProperty {
  type: "string" | "number" | "boolean" | "object" | "array" | "null";
  description?: string;
  enum?: unknown[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface JSONSchema {
  type: "object";
  properties: Record<string, JSONSchemaProperty>;
  required: string[];
  additionalProperties: false;
}

export interface ResponseFormat {
  type: "json_schema";
  json_schema: {
    name: string;
    strict: true;
    schema: JSONSchema;
  };
}

// Request types
export interface CompletionRequest {
  messages: Message[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
  response_format?: ResponseFormat;
  stop?: string | string[];
  stream?: boolean;
}

// Response types
export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Choice {
  index: number;
  message: {
    role: "assistant";
    content: string;
  };
  finish_reason: "stop" | "length" | "content_filter" | "tool_calls";
}

export interface CompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: Choice[];
  usage?: Usage;
}

// Stream types
export interface StreamChoice {
  index: number;
  delta: {
    role?: "assistant";
    content?: string;
  };
  finish_reason?: "stop" | "length" | "content_filter";
}

export interface StreamChunk {
  id: string;
  model: string;
  created: number;
  choices: StreamChoice[];
}

// Model types
export interface Model {
  id: string;
  name: string;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  context_length: number;
  architecture?: {
    modality: string;
    tokenizer: string;
  };
}

// Config types
export interface OpenRouterConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  siteName?: string;
  siteUrl?: string;
}
