// app/components/FieldToolbox.tsx
import { useFormBuilderStore, FieldType } from '~/store/formBuilderStore';

export default function FieldToolbox() {
  const addField = useFormBuilderStore((state) => state.addField);
  const addStep = useFormBuilderStore((state) => state.addStep);

  const fieldTypes: { label: string; type: FieldType }[] = [
    { label: 'Text Input', type: 'text' },
    { label: 'Textarea', type: 'textarea' },
    { label: 'Dropdown', type: 'dropdown' },
    { label: 'Checkbox', type: 'checkbox' },
    { label: 'Date Picker', type: 'date' },
    { label: 'File Upload', type: 'fileUpload' },
  ];

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Add Fields</h3>
      <div className="space-y-2">
        {fieldTypes.map((field) => (
          <button
            key={field.type}
            onClick={() => addField(field.type)}
            className="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 hover:bg-teal-100 dark:bg-gray-600 dark:hover:bg-teal-700 transition duration-200"
          >
            {field.label}
          </button>
        ))}
        <hr className="my-4 border-gray-300 dark:border-gray-600" />
        <button
          onClick={addStep}
          className="w-full text-left p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-teal-50 hover:bg-green-100 dark:bg-teal-600 dark:hover:bg-teal-700 transition duration-200 font-medium"
        >
          Add New Step
        </button>
      </div>
    </div>
  );
}