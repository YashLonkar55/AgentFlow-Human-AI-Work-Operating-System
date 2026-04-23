import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  WorkflowState, AgentStep, ChatMessage,
  LogEntry, StepStatus, ExecutionMode,
} from '@/types/agent';

interface AgentStore {
  workflow: WorkflowState | null;
  chat: ChatMessage[];
  isPlanning: boolean;
  isChatOpen: boolean;
  planError: string | null;
  executionMode: ExecutionMode;

  // Planning
  planWorkflow: (goal: string) => Promise<void>;
  resetWorkflow: () => void;
  setPlanError: (e: string | null) => void;

  // Execution mode
  setExecutionMode: (mode: ExecutionMode) => void;

  // Step mutations
  setSteps: (steps: AgentStep[]) => void;
  updateStep: (id: string, updates: Partial<AgentStep>) => void;
  addLog: (stepId: string, log: LogEntry) => void;
  setWorkflowStatus: (status: WorkflowState['status']) => void;
  setCurrentStep: (index: number) => void;
  setFinalOutput: (output: string) => void;

  // Approval
  approveStep: (stepId: string) => void;
  rejectStep: (stepId: string, feedback: string) => void;

  // Chat
  addChatMessage: (message: ChatMessage) => void;
  setIsChatOpen: (v: boolean) => void;
}

export const useAgentStore = create<AgentStore>()(
  immer((set) => ({
    workflow: null,
    chat: [],
    isPlanning: false,
    isChatOpen: false,
    planError: null,
    executionMode: 'auto',

    planWorkflow: async (goal: string) => {
      set(s => {
        s.isPlanning = true;
        s.planError = null;
        s.workflow = {
          id: crypto.randomUUID(),
          goal: goal.trim(),
          steps: [],
          status: 'planning',
          currentStepIndex: 0,
          executionMode: 'auto',
          createdAt: new Date(),
        };
      });

      try {
        const res = await fetch('/api/plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goal: goal.trim() }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? 'Unknown error');

        const steps: AgentStep[] = data.steps.map((s: {
          id: string; title: string; description: string;
        }) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          status: 'pending' as StepStatus,
          logs: [],
        }));

        set(s => {
          if (s.workflow) {
            s.workflow.steps = steps;
            s.workflow.status = 'idle';
          }
          s.isPlanning = false;
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to plan';
        set(s => {
          s.isPlanning = false;
          s.planError = msg;
          if (s.workflow) s.workflow.status = 'failed';
        });
      }
    },

    resetWorkflow: () => set(s => {
      s.workflow = null;
      s.chat = [];
      s.isPlanning = false;
      s.planError = null;
      s.executionMode = 'auto';
    }),

    setPlanError: (e) => set(s => { s.planError = e; }),
    setExecutionMode: (m) => set(s => {
      s.executionMode = m;
      if (s.workflow) s.workflow.executionMode = m;
    }),

    setSteps: (steps) => set(s => {
      if (s.workflow) s.workflow.steps = steps;
    }),

    updateStep: (id, updates) => set(s => {
      if (!s.workflow) return;
      const step = s.workflow.steps.find(x => x.id === id);
      if (step) Object.assign(step, updates);
    }),

    addLog: (stepId, log) => set(s => {
      if (!s.workflow) return;
      const step = s.workflow.steps.find(x => x.id === stepId);
      if (step) step.logs.push(log);
    }),

    setWorkflowStatus: (status) => set(s => {
      if (s.workflow) s.workflow.status = status;
    }),

    setCurrentStep: (index) => set(s => {
      if (s.workflow) s.workflow.currentStepIndex = index;
    }),

    setFinalOutput: (output) => set(s => {
      if (s.workflow) s.workflow.finalOutput = output;
    }),

    /* ── Approval actions ── */
    approveStep: (stepId) => set(s => {
      if (!s.workflow) return;
      const step = s.workflow.steps.find(x => x.id === stepId);
      if (step) {
        step.status = 'completed';
        step.completedAt = new Date();
      }
      s.workflow.status = 'running'; // signal engine to continue
    }),

    rejectStep: (stepId, feedback) => set(s => {
      if (!s.workflow) return;
      const step = s.workflow.steps.find(x => x.id === stepId);
      if (step) {
        step.status = 'pending'; // reset so engine reruns it
        step.logs = [];
        step.output = undefined;
        // Append feedback as a log so the executor sees it
        step.logs.push({
          id: crypto.randomUUID(),
          timestamp: new Date(),
          message: `User feedback: ${feedback}`,
          level: 'warning',
        });
      }
      s.workflow.status = 'running';
    }),

    addChatMessage: (m) => set(s => { s.chat.push(m); }),
    setIsChatOpen: (v) => set(s => { s.isChatOpen = v; }),
  })),
);