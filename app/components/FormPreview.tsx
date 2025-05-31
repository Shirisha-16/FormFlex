// app/components/FormPreview.tsx
import { useState, useMemo } from 'react';
// UPDATED: Import FileUploadField
import type { AnyFormField, DropdownField, CheckboxField, FileUploadField } from '~/store/formBuilderStore';

interface FormPreviewProps {
  field: AnyFormField;
  previewMode: 'builder' | 'filler'; // 'builder' for editing, 'filler' for actual form filling
}

export default function FormPreview({ field, previewMode }: FormPreviewProps) {
  const [value, setValue] = useState<string>(''); // Used for text, textarea, dropdown, date
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // For file input
  const [error, setError] = useState<string | null>(null);

  const validateField = (currentValue: string): boolean => {
    let currentError: string | null = null;

    // Validation for `required` fields
    if (field.required) {
      if (field.type === 'fileUpload') {
        if (!selectedFile) { // Check if a file is selected for fileUpload
          currentError = `${field.label} is required.`;
        }
      } else if (!currentValue) { // For other fields, check if `currentValue` is empty
        currentError = `${field.label} is required.`;
      }
    }

    // Specific validation for text/textarea fields
    if (field.type === 'text' || field.type === 'textarea') {
      if (field.validation.minLength && currentValue.length < field.validation.minLength) {
        currentError = `${field.label} must be at least ${field.validation.minLength} characters.`;
      }
      if (field.validation.maxLength && currentValue.length > field.validation.maxLength) {
        currentError = `${field.label} must be at most ${field.validation.maxLength} characters.`;
      }
      if (field.type === 'text' && field.validation.pattern) {
        try {
          const regex = new RegExp(field.validation.pattern);
          if (currentValue && !regex.test(currentValue)) {
            currentError = `${field.label} format is invalid.`;
          }
        } catch (e) {
          console.error("Invalid regex pattern:", field.validation.pattern);
          currentError = `Invalid validation pattern for ${field.label}.`;
        }
      }
    } else if (field.type === 'checkbox') {
      // For checkboxes, if required, value must be 'true'
      if (field.required && currentValue !== 'true') {
        currentError = `${field.label} is required.`;
      }
    }
    setError(currentError);
    return !currentError; // Returns true if no error, false otherwise
  };

  // UPDATED: Handle change for file input specifically
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (e.target instanceof HTMLInputElement && e.target.type === 'file') {
      const files = e.target.files;
      if (files && files.length > 0) {
        setSelectedFile(files[0]);
        // For validation in filler mode, we can trigger validation
        if (previewMode === 'filler') {
          validateField('file_selected'); // Use a dummy string to indicate a file is present
        }
      } else {
        setSelectedFile(null);
        if (previewMode === 'filler') {
          validateField(''); // Indicate no file selected
        }
      }
      return; // Exit as file input handled
    }

    // Existing logic for other input types
    const newValue = e.target.value;
    setValue(newValue);
    if (previewMode === 'filler') {
      validateField(newValue);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // No blur validation needed for file input in this simple setup,
    // or if the element is not a standard input
    if (e.target instanceof HTMLInputElement && e.target.type === 'file') {
        return;
    }

    if (previewMode === 'filler') {
      validateField(e.target.value);
    }
  };

  const renderField = useMemo(() => {
    const commonProps = {
      id: field.id,
      name: field.id,
      placeholder: field.placeholder, // Not applicable for file/checkbox, but harmless
      required: field.required,
      className: `mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500
        ${error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
        bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`,
      onChange: handleChange,
      onBlur: handleBlur,
      disabled: previewMode === 'builder', // Disable inputs in builder mode
    };

    switch (field.type) {
      case 'text':
        return <input type="text" value={value} {...commonProps} />;
      case 'textarea':
        return <textarea rows={3} value={value} {...commonProps} />;
      case 'dropdown':
        return (
          <select value={value} {...commonProps}>
            <option value="">Select an option</option>
            {(field as DropdownField).options?.map((option, idx) => ( // Type assertion
              <option key={option.value || idx} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              {...commonProps}
              checked={value === 'true'} // Checkbox value as string 'true'/'false'
              onChange={(e) => {
                setValue(e.target.checked ? 'true' : 'false');
                if (previewMode === 'filler') {
                    // Clear error immediately on change if checkbox is checked
                    setError(null);
                    // Re-evaluate if required and unchecked
                    if (field.required && !e.target.checked) {
                        setError(`${field.label} is required.`);
                    }
                }
              }}
              className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 dark:bg-gray-600 dark:border-gray-500 mr-2"
            />
            <label htmlFor={field.id} className="text-gray-900 dark:text-gray-100 cursor-pointer">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
          </div>
        );
      case 'date':
        return <input type="date" value={value} {...commonProps} />;
      // NEW CASE: File Upload Field
      case 'fileUpload':
        const fileUploadField = field as FileUploadField; // Type assertion for specific properties
        return (
          <div className="flex items-center space-x-2">
            <input
              type="file"
              {...commonProps}
              value="" // File input value is always empty string for security reasons
              accept={fileUploadField.accept} // Apply accepted file types from properties
              multiple={fileUploadField.multiple} // Allow multiple files from properties
              // Custom Tailwind styling for file input appearance
              className={`block w-full text-sm text-gray-900 dark:text-gray-100
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-teal-50 file:text-teal-700
                hover:file:bg-teal-100 dark:file:bg-teal-800 dark:file:text-teal-200 dark:hover:file:bg-teal-700
                cursor-pointer
                ${previewMode === 'builder' ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            />
            {/* Display selected file name in filler mode */}
            {previewMode === 'filler' && selectedFile && (
              <span className="text-sm text-gray-600 dark:text-gray-300 truncate">
                Selected: {selectedFile.name}
              </span>
            )}
          </div>
        );
      default:
        return <p className="text-red-500">Unsupported field type</p>;
    }
  }, [field, value, error, previewMode, handleChange, handleBlur, selectedFile]); // Add selectedFile to dependencies

  return (
    <div className="mb-4">
      {field.type !== 'checkbox' && (
        <label htmlFor={field.id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </label>
      )}
      {renderField}
      {field.helpText && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
}