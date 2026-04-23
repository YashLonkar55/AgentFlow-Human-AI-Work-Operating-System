export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'rejected' | 'awaiting_approval';

export type ExecutionMode = 'auto' | 'review';

export interface AgentStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  logs: LogEntry[];
  output?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface WorkflowState {
  id: string;
  goal: string;
  steps: AgentStep[];
  status: 'idle' | 'planning' | 'running' | 'paused' | 'completed' | 'failed' | 'awaiting_approval';
  currentStepIndex: number;
  executionMode: ExecutionMode;
  finalOutput?: string;
  createdAt: Date;
}