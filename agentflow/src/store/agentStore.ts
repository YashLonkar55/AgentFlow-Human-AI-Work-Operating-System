import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  WorkflowState,
  AgentStep,
  ChatMessage,
  LogEntry,
  StepStatus,
} from '@/types/agent';

interface AgentStore {
  workflow:     WorkflowState | null;
  chat:         ChatMessage[];
  isPlanning:   boolean;
  isChatOpen:   boolean;
  planError:    string | null;

  // Planning
  planWorkflow:      (goal: string) => Promise<void>;
  resetWorkflow:     () => void;
  setPlanError:      (e: string | null) => void;

  // Step mutation (used by execution engine in Phase 4)
  setSteps:          (steps: AgentStep[]) => void;
  updateStep:        (id: string, updates: Partial<AgentStep>) => void;
  addLog:            (stepId: string, log: LogEntry) => void;
  setWorkflowStatus: (status: WorkflowState['status']) => void;
  setCurrentStep:    (index: number) => void;
  setFinalOutput:    (output: string) => void;

  // Chat
  addChatMessage:    (message: ChatMessage) => void;
  setIsChatOpen:     (v: boolean) => void;
}

export const useAgentStore = create<AgentStore>()(
  immer((set, get) => ({
    workflow:   null,
    chat:       [],
    isPlanning: false,
    isChatOpen: false,
    planError:  null,

    /* ── Plan: calls /api/plan and populates steps ── */
    planWorkflow: async (goal: string) => {
      set(s => {
        s.isPlanning  = true;
        s.planError   = null;
        s.workflow    = {
          id:               crypto.randomUUID(),
          goal:             goal.trim(),
          steps:            [],
          status:           'planning',
          currentStepIndex: 0,
          createdAt:        new Date(),
        };
      });

      try {
        const res = await fetch('/api/plan', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ goal: goal.trim() }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? 'Unknown error from /api/plan');
        }

        // Hydrate each step with required runtime fields
        const steps: AgentStep[] = data.steps.map((s: {
          id: string;
          title: string;
          description: string;
        }) => ({
          id:          s.id,
          title:       s.title,
          description: s.description,
          status:      'pending' as StepStatus,
          logs:        [],
          output:      undefined,
          startedAt:   undefined,
          completedAt: undefined,
        }));

        set(s => {
          if (s.workflow) {
            s.workflow.steps  = steps;
            s.workflow.status = 'idle'; // ready to execute (Phase 4)
          }
          s.isPlanning = false;
        });

      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to plan workflow';
        set(s => {
          s.isPlanning  = false;
          s.planError   = msg;
          if (s.workflow) s.workflow.status = 'failed';
        });
      }
    },

    resetWorkflow: () => set(s => {
      s.workflow   = null;
      s.chat       = [];
      s.isPlanning = false;
      s.planError  = null;
    }),

    setPlanError: (e) => set(s => { s.planError = e; }),

    setSteps: (steps) => set(s => {
      if (s.workflow) s.workflow.steps = steps;
    }),

    updateStep: (id, updates) => set(s => {
      if (!s.workflow) return;
      const step = s.workflow.steps.find(step => step.id === id);
      if (step) Object.assign(step, updates);
    }),

    addLog: (stepId, log) => set(s => {
      if (!s.workflow) return;
      const step = s.workflow.steps.find(step => step.id === stepId);
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

    addChatMessage: (message) => set(s => { s.chat.push(message); }),

    setIsChatOpen: (v) => set(s => { s.isChatOpen = v; }),
  })),
);