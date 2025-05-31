// app/components/MultiStepNavigation.tsx
import { useFormBuilderStore, FormStep } from '~/store/formBuilderStore';
import { useState } from 'react';

interface MultiStepNavigationProps {
  steps: FormStep[];
  activeStepId: string | null;
  setActiveStep: (stepId: string) => void;
}

export default function MultiStepNavigation({ steps, activeStepId, setActiveStep }: MultiStepNavigationProps) {
  const { updateStepName, removeStep } = useFormBuilderStore();
  const [editingStepId, setEditingStepId] = useState<string | null>(null);
  const [newStepName, setNewStepName] = useState('');

  const handleEditClick = (step: FormStep) => {
    setEditingStepId(step.id);
    setNewStepName(step.name);
  };

  const handleSaveEdit = (stepId: string) => {
    if (newStepName.trim() !== '') {
      updateStepName(stepId, newStepName);
    }
    setEditingStepId(null);
  };

  const handleDeleteStep = (stepId: string) => {
    if (window.confirm('Are you sure you want to delete this step and reassign its fields?')) {
      removeStep(stepId);
    }
  };

  return (
    <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-inner">
      <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Form Steps</h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`relative flex items-center p-3 rounded-lg cursor-pointer transition duration-300
              ${activeStepId === step.id ? 'bg-teal-500 text-white shadow-md' : 'bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-100 hover:bg-teal-200 dark:hover:bg-teal-700'}
            `}
            onClick={() => setActiveStep(step.id)}
          >
            <span className="font-bold mr-2">{index + 1}.</span>
            {editingStepId === step.id ? (
              <input
                type="text"
                value={newStepName}
                onChange={(e) => setNewStepName(e.target.value)}
                onBlur={() => handleSaveEdit(step.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit(step.id);
                }}
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 rounded outline-none w-28"
                autoFocus
              />
            ) : (
              <span className="flex-1" onDoubleClick={() => handleEditClick(step)}>
                {step.name}
              </span>
            )}
            <div className="ml-2 flex space-x-1">
              {editingStepId !== step.id && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleEditClick(step); }}
                  className="p-1 text-gray-600 dark:text-gray-300 hover:text-teal-700 dark:hover:text-teal-300"
                  aria-label="Edit step name"
                >
                  ✏️
                </button>
              )}
              {steps.length > 1 && ( // Don't allow deleting if only one step
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteStep(step.id); }}
                  className="p-1 text-red-600 hover:text-red-800"
                  aria-label="Delete step"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}