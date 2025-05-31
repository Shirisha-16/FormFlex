// app/store/formBuilderStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid'; // npm install uuid @types/uuid

// Define Field Types
export type FieldType = 'text' | 'textarea' | 'dropdown' | 'checkbox' | 'date' | 'fileUpload';

// Base Field Properties
export interface FormField {
  id: string;
  type: FieldType; // Discriminating union property
  label: string;
  placeholder?: string;
  required: boolean;
  helpText?: string;
  order: number; // For reordering
  validation: {
    minLength?: number;
    maxLength?: number;
    pattern?: string; // Regex for email/phone
  };
}

// Specific Field Properties (Discriminated Union for type safety)
export interface TextField extends FormField {
  type: 'text';
}

export interface TextareaField extends FormField {
  type: 'textarea';
}

export interface DropdownField extends FormField {
  type: 'dropdown';
  options: { label: string; value: string }[];
}

export interface DropdownOption {
  label: string;
  value: string;
}
export interface CheckboxField extends FormField {
  type: 'checkbox';
}

export interface DateField extends FormField {
  type: 'date';
}

export interface FileUploadField extends FormField {
  type: 'fileUpload';
  accept?: string; // e.g., "image/*", ".pdf", ".doc" - for the HTML accept attribute
  multiple?: boolean; // Allow multiple files selection
}
export type AnyFormField = TextField | TextareaField | DropdownField | CheckboxField | DateField | FileUploadField;

// Form Step
export interface FormStep {
  id: string;
  name: string;
  fieldIds: string[]; // IDs of fields belonging to this step
}

// Simplified state for history (without circular references)
interface HistoryState {
  fields: AnyFormField[];
  steps: FormStep[];
  activeStepId: string | null;
  formName: string;
  theme: 'light' | 'dark';
}

// Store State Interface
interface FormBuilderState {
  fields: AnyFormField[];
  steps: FormStep[];
  activeStepId: string | null;
  selectedFieldId: string | null;
  formName: string;
  theme: 'light' | 'dark';
  // For Undo/Redo
  past: HistoryState[];
  future: HistoryState[];
}

// Store Actions Interface
interface FormBuilderActions {
  addField: (type: FieldType) => void;
  updateField: (id: string, updates: Partial<AnyFormField>) => void;
  removeField: (id: string) => void;
  reorderFields: (startIndex: number, endIndex: number) => void;
  setSelectedField: (id: string | null) => void;
  setFormName: (name: string) => void;
  toggleTheme: () => void;

  // Multi-step actions
  addStep: () => void;
  updateStepName: (stepId: string, newName: string) => void;
  removeStep: (stepId: string) => void;
  moveFieldToStep: (fieldId: string, targetStepId: string) => void;
  setActiveStep: (stepId: string) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  _addToHistory: () => void; 
  clearForm : ()=>void;
}

type FormBuilderStore = FormBuilderState & FormBuilderActions;

const initialFormBuilderState: FormBuilderState = {
  fields: [],
  steps: [],
  activeStepId: null,
  selectedFieldId: null,
  formName: 'My New Form',
  theme: 'light',
  past: [],
  future: [],
};

export const useFormBuilderStore = create<FormBuilderStore>()(
  persist(
    (set, get) => ({
      ...initialFormBuilderState,

      _addToHistory: () => {
        const { fields, steps, activeStepId, formName, theme, past } = get();
        const newHistoryState: HistoryState = {
          fields: structuredClone(fields), // Deep clone to avoid mutations
          steps: structuredClone(steps),
          activeStepId,
          formName,
          theme
        };

        set({
          past: [...past.slice(-9), newHistoryState], // Keep only last 10 states for performance
          future: [],
        });
      },

      addField: (type) => {
        get()._addToHistory(); // Save current state before modification

        const baseField = {
          id: uuidv4(),
          label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
          required: false,
          order: get().fields.length,
          validation: {},
        };

        let newField: AnyFormField;

        switch (type) {
          case 'text':
            newField = { ...baseField, type: 'text' } as TextField;
            break;
          case 'textarea':
            newField = { ...baseField, type: 'textarea' } as TextareaField;
            break;
          case 'dropdown':
            newField = {
              ...baseField,
              type: 'dropdown',
              options: [{ label: 'Option 1', value: 'option1' }]
            } as DropdownField;
            break;
          case 'checkbox':
            newField = { ...baseField, type: 'checkbox' } as CheckboxField;
            break;
          case 'date':
            newField = { ...baseField, type: 'date' } as DateField;
            break;
          case 'fileUpload': // ADDED CASE FOR FILEUPLOAD
            newField = {
              ...baseField,
              type: 'fileUpload',
              accept: '', 
              multiple: false,
            } as FileUploadField;
            break;
          default:
            const exhaustiveCheck: never = type;
            throw new Error(`Unhandled field type: ${exhaustiveCheck}`);
        }

        set((state) => {
          const updatedFields = [...state.fields, newField];

          if (state.steps.length === 0) {
            // If no steps, add a default step and assign the field
            const newStep: FormStep = {
              id: uuidv4(),
              name: 'Step 1',
              fieldIds: [newField.id]
            };
            return {
              fields: updatedFields,
              steps: [newStep],
              activeStepId: newStep.id,
            };
          } else {
            // Add to the active step or the first step
            const currentSteps = structuredClone(state.steps); // Deep clone steps for immutability
            let targetStep = currentSteps.find(step => step.id === state.activeStepId);
            if (!targetStep && currentSteps.length > 0) {
              targetStep = currentSteps[0]; // Fallback to first step if activeStepId is invalid/null
            }
            if (targetStep) {
              targetStep.fieldIds.push(newField.id);
            }
            return { fields: updatedFields, steps: currentSteps };
          }
        });
      },

      updateField: (id, updates) => {
        get()._addToHistory();
        set((state) => ({
          fields: state.fields.map((field) =>
            field.id === id ? { ...field, ...updates } as AnyFormField : field
          ),
        }));
      },

      removeField: (id) => {
        get()._addToHistory();
        set((state) => {
          const updatedFields = state.fields.filter((field) => field.id !== id);
          const updatedSteps = state.steps
            .map(step => ({
              ...step,
              fieldIds: step.fieldIds.filter(fieldId => fieldId !== id)
            }))
            .filter(step => step.fieldIds.length > 0); // Remove empty steps

          // Handle active step changes
          let newActiveStepId = state.activeStepId;
          // If the active step is now empty or removed, try to set to the first available step
          if (updatedSteps.length > 0 && (!newActiveStepId || !updatedSteps.some(step => step.id === newActiveStepId))) {
            newActiveStepId = updatedSteps[0].id;
          } else if (updatedSteps.length === 0) { // If no steps left
            newActiveStepId = null;
          }

          return {
            fields: updatedFields,
            steps: updatedSteps,
            selectedFieldId: state.selectedFieldId === id ? null : state.selectedFieldId, // Deselect if removed
            activeStepId: newActiveStepId
          };
        });
      },

      reorderFields: (startIndex, endIndex) => {
        get()._addToHistory();
        set((state) => {
          const sortedFields = [...state.fields].sort((a, b) => a.order - b.order);
          const [removed] = sortedFields.splice(startIndex, 1);
          sortedFields.splice(endIndex, 0, removed);

          // Update the order property for all fields
          const reorderedFields = sortedFields.map((field, index) => ({
            ...field,
            order: index,
          }));

          return { fields: reorderedFields };
        });
      },

      setSelectedField: (id) => set({ selectedFieldId: id }),

      setFormName: (name) => {
        get()._addToHistory();
        set({ formName: name });
      },

      toggleTheme: () => set((state) => ({
        theme: state.theme === 'light' ? 'dark' : 'light'
      })),

      // Multi-step actions
      addStep: () => {
        get()._addToHistory();
        set((state) => {
          const newStep: FormStep = {
            id: uuidv4(),
            name: `Step ${state.steps.length + 1}`,
            fieldIds: []
          };
          return {
            steps: [...state.steps, newStep],
            activeStepId: newStep.id, // Make new step active by default
          };
        });
      },

      updateStepName: (stepId, newName) => {
        get()._addToHistory();
        set((state) => ({
          steps: state.steps.map(step =>
            step.id === stepId ? { ...step, name: newName } : step
          )
        }));
      },

      removeStep: (stepId) => {
        get()._addToHistory();
        set((state) => {
          const removedStep = state.steps.find(s => s.id === stepId);
          if (!removedStep) return state;

          const updatedSteps = state.steps.filter(step => step.id !== stepId);
          const fieldsToReassign = removedStep.fieldIds;

          let newActiveStepId: string | null = null;
          if (updatedSteps.length > 0) {
            newActiveStepId = updatedSteps[0].id; // Set first available step as active

            if (fieldsToReassign.length > 0) {
              const targetStep = updatedSteps.find(step => step.id === newActiveStepId);
              if (targetStep) {
                targetStep.fieldIds = [...targetStep.fieldIds, ...fieldsToReassign];
              }
            }
          } else {
            newActiveStepId = null;
          }

          return {
            steps: updatedSteps,
            activeStepId: newActiveStepId,
            selectedFieldId: fieldsToReassign.includes(state.selectedFieldId || '')
              ? null
              : state.selectedFieldId
          };
        });
      },

      moveFieldToStep: (fieldId, targetStepId) => {
        get()._addToHistory();
        set((state) => {
          const updatedSteps = state.steps.map(step => {
            const newFieldIds = step.fieldIds.filter(id => id !== fieldId); // Remove from current step
            if (step.id === targetStepId) {
              // Add to target step, ensure it's not duplicated if already there (though filter above should prevent)
              if (!newFieldIds.includes(fieldId)) {
                newFieldIds.push(fieldId);
              }
            }
            return { ...step, fieldIds: newFieldIds };
          });
          return { steps: updatedSteps };
        });
      },

      setActiveStep: (stepId) => set({ activeStepId: stepId }),

      undo: () => {
        const { past, fields, steps, activeStepId, formName, theme, future } = get();
        if (past.length === 0) return;

        const previousState = past[past.length - 1];
        const newPast = past.slice(0, past.length - 1);

        const currentState: HistoryState = {
          fields: structuredClone(fields),
          steps: structuredClone(steps),
          activeStepId,
          formName,
          theme
        };

        set({
          ...previousState,
          past: newPast,
          future: [currentState, ...future],
          selectedFieldId: null // Clear selection on undo for consistency
        });
      },

      redo: () => {
        const { future, fields, steps, activeStepId, formName, theme, past } = get();
        if (future.length === 0) return;

        const nextState = future[0];
        const newFuture = future.slice(1);

        const currentState: HistoryState = {
          fields: structuredClone(fields),
          steps: structuredClone(steps),
          activeStepId,
          formName,
          theme
        };

        set({
          ...nextState,
          past: [...past, currentState],
          future: newFuture,
          selectedFieldId: null // Clear selection on redo for consistency
        });
      },
      // NEW: Clear Form Action
      clearForm: () => {
        get()._addToHistory(); // Save current state before clearing
        set({
          fields: [],
          steps: [],
          activeStepId: null,
          selectedFieldId: null,
          formName: initialFormBuilderState.formName, // Reset to default name
          // theme is intentionally not reset here, it's a user preference
          future: [], // Clear future as a new "empty" state is created
        });
      },
    }),
    {
      name: 'form-builder-storage',
      // Define which parts of the state to persist (exclude past/future for undo/redo)
      partialize: (state) => ({
        fields: state.fields,
        steps: state.steps,
        activeStepId: state.activeStepId,
        formName: state.formName,
        theme: state.theme,
        selectedFieldId: state.selectedFieldId, // selectedFieldId should be persisted too
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.past = [];
          state.future = [];
        }
      }
    }
  )
);