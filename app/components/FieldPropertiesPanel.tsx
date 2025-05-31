// app/components/FieldPropertiesPanel.tsx
import { useFormBuilderStore } from '~/store/formBuilderStore';
// UPDATED: Import FileUploadField
import type { AnyFormField, DropdownField, DropdownOption, FileUploadField } from '~/store/formBuilderStore';

export default function FieldPropertiesPanel() {
  const { fields, selectedFieldId, updateField, removeField, steps, moveFieldToStep } = useFormBuilderStore();

  // Find the currently selected field for editing
  const selectedField: AnyFormField | undefined = selectedFieldId
    ? fields.find((f) => f.id === selectedFieldId)
    : undefined;

  if (!selectedField) {
    return (
      <div className="text-gray-500 dark:text-gray-400 text-center py-8">
        Select a field to edit its properties.
      </div>
    );
  }

  // --- Handlers for Field Properties ---
  const handleValidationChange = (key: keyof AnyFormField['validation'], value: any) => {
    updateField(selectedField.id, {
      validation: {
        // Use an empty object if validation is undefined, to allow adding properties
        ...(selectedField.validation || {}),
        [key]: value,
      },
    });
  };

  const handleDropdownOptionChange = (index: number, type: keyof DropdownOption, value: string) => {
    // Type guard: ensure selectedField is a DropdownField before accessing options
    if (selectedField.type === 'dropdown') {
      const updatedOptions: DropdownOption[] = [...(selectedField.options || [])];
      updatedOptions[index] = { ...updatedOptions[index], [type]: value };
      updateField(selectedField.id, { options: updatedOptions } as Partial<DropdownField>);
    }
  };

  const addDropdownOption = () => {
    if (selectedField.type === 'dropdown') {
      const currentOptions: DropdownOption[] = selectedField.options || [];
      updateField(selectedField.id, {
        options: [...currentOptions, { label: `Option ${currentOptions.length + 1}`, value: `option${currentOptions.length + 1}` }]
      } as Partial<DropdownField>);
    }
  };

  const removeDropdownOption = (index: number) => {
    if (selectedField.type === 'dropdown') {
      const updatedOptions: DropdownOption[] = (selectedField.options || []).filter((_, i) => i !== index);
      updateField(selectedField.id, { options: updatedOptions } as Partial<DropdownField>);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Field Properties</h3>

      {/* Display Field Type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Field Type</label>
        <p className="mt-1 block w-full text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-600 rounded-md p-2">
          {selectedField.type.charAt(0).toUpperCase() + selectedField.type.slice(1)}
        </p>
      </div>

      {/* Label Input */}
      <div>
        <label htmlFor="label" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Label
        </label>
        <input
          type="text"
          id="label"
          value={selectedField.label}
          onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
          aria-label="Field Label"
        />
      </div>

      {/* Placeholder Input (hidden for checkbox and file upload) */}
      {selectedField.type !== 'checkbox' && selectedField.type !== 'fileUpload' && (
        <div>
          <label htmlFor="placeholder" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Placeholder
          </label>
          <input
            type="text"
            id="placeholder"
            value={selectedField.placeholder || ''}
            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Field Placeholder"
          />
        </div>
      )}

      {/* Help Text Input */}
      <div>
        <label htmlFor="helpText" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Help Text
        </label>
        <textarea
          id="helpText"
          value={selectedField.helpText || ''}
          onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
          rows={2}
          className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
          aria-label="Field Help Text"
        />
      </div>

      {/* Required Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="required"
          checked={selectedField.required}
          onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
          className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 dark:bg-gray-600 dark:border-gray-500"
          aria-label="Is field required?"
        />
        <label htmlFor="required" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
          Required
        </label>
      </div>

      {/* Validation Properties (hidden for file upload) */}
      {selectedField.type !== 'fileUpload' && ( // Condition added
        <>
          <h4 className="text-lg font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-200">Validation</h4>
          {['text', 'textarea'].includes(selectedField.type) && (
            <>
              <div>
                <label htmlFor="minLength" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Min Length
                </label>
                <input
                  type="number"
                  id="minLength"
                  value={selectedField.validation.minLength || ''}
                  onChange={(e) => handleValidationChange('minLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
                  aria-label="Minimum length"
                />
              </div>
              <div>
                <label htmlFor="maxLength" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Length
                </label>
                <input
                  type="number"
                  id="maxLength"
                  value={selectedField.validation.maxLength || ''}
                  onChange={(e) => handleValidationChange('maxLength', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
                  aria-label="Maximum length"
                />
              </div>
            </>
          )}

          {selectedField.type === 'text' && (
            <div>
              <label htmlFor="pattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Pattern (Regex)
              </label>
              <input
                type="text"
                id="pattern"
                value={selectedField.validation.pattern || ''}
                onChange={(e) => handleValidationChange('pattern', e.target.value)}
                placeholder="e.g., ^\S+@\S+\.\S+$ for email"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
                aria-label="Validation pattern (Regex)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Example: Email (`^\S+@\S+\.\S+$`), Phone (`^\d{10}$`)
              </p>
            </div>
          )}
        </>
      )}

      {/* Dropdown Options (Conditional for dropdown type) */}
      {selectedField.type === 'dropdown' && (
        <>
          <h4 className="text-lg font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-200">Dropdown Options</h4>
          {(selectedField as DropdownField).options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                placeholder="Label"
                value={option.label}
                onChange={(e) => handleDropdownOptionChange(index, 'label', e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
                aria-label={`Option ${index + 1} Label`}
              />
              <input
                type="text"
                placeholder="Value"
                value={option.value}
                onChange={(e) => handleDropdownOptionChange(index, 'value', e.target.value)}
                className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
                aria-label={`Option ${index + 1} Value`}
              />
              <button
                onClick={() => removeDropdownOption(index)}
                className="p-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200"
                aria-label={`Remove option ${index + 1}`}
              >
                &times;
              </button>
            </div>
          ))}
          <button
            onClick={addDropdownOption}
            className="w-full py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition duration-200 shadow-sm"
            aria-label="Add new dropdown option"
          >
            Add Option
          </button>
        </>
      )}

      {/* NEW: File Upload Specific Properties */}
      {selectedField.type === 'fileUpload' && (
        <>
          <h4 className="text-lg font-semibold mt-6 mb-2 text-gray-800 dark:text-gray-200">File Upload Settings</h4>
          <div>
            <label htmlFor="accept" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Accepted File Types (e.g., image/*, .pdf, .docx)
            </label>
            <input
              type="text"
              id="accept"
              value={(selectedField as FileUploadField).accept || ''}
              onChange={(e) => updateField(selectedField.id, { accept: e.target.value } as Partial<FileUploadField>)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
              placeholder="image/*, .pdf, .docx"
              aria-label="Accepted file types"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Comma-separated MIME types or file extensions.
            </p>
          </div>
          <div className="flex items-center mt-2">
            <input
              type="checkbox"
              id="multiple"
              checked={(selectedField as FileUploadField).multiple || false}
              onChange={(e) => updateField(selectedField.id, { multiple: e.target.checked } as Partial<FileUploadField>)}
              className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 dark:bg-gray-600 dark:border-gray-500"
              aria-label="Allow multiple files"
            />
            <label htmlFor="multiple" className="ml-2 block text-sm text-gray-900 dark:text-gray-100">
              Allow Multiple Files
            </label>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-4">
             Note: Direct Google Drive/cloud integration requires complex backend setup (OAuth, API calls) and is beyond the scope of a basic client-side form builder. This field provides a standard local file input.
          </p>
        </>
      )}

      {/* Move to Step Dropdown (Conditional if multiple steps exist) */}
      {steps.length > 1 && (
        <div className="mt-6">
          <label htmlFor="moveToStep" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Move to Step
          </label>
          <select
            id="moveToStep"
            // Find which step the selected field currently belongs to
            value={steps.find(step => step.fieldIds.includes(selectedField.id))?.id || ''}
            onChange={(e) => moveFieldToStep(selectedField.id, e.target.value)}
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-teal-500 focus:border-teal-500"
            aria-label="Move field to different step"
          >
            {steps.map(step => (
              <option key={step.id} value={step.id}>{step.name}</option>
            ))}
          </select>
        </div>
      )}

      <hr className="my-6 border-gray-300 dark:border-gray-600" />

      {/* Delete Field Button */}
      <button
        onClick={() => {
          if (window.confirm('Are you sure you want to delete this field?')) {
            removeField(selectedField.id);
          }
        }}
        className="w-full py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition duration-200 shadow-sm"
        aria-label="Delete field"
      >
        Delete Field
      </button>
    </div>
  );
}