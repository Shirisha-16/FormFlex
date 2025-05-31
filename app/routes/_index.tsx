// app/routes/_index.tsx
import { useState, useRef } from 'react';
import { useFormBuilderStore, AnyFormField, FormStep } from '~/store/formBuilderStore';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Components
import FieldToolbox from '~/components/FieldToolbox';
import FieldPropertiesPanel from '~/components/FieldPropertiesPanel';
import FormPreview from '~/components/FormPreview';
import Header from '~/components/Header';
import MultiStepNavigation from '~/components/MultiStepNavigation';
import { generateShareLink, generateFormId, saveFormToLocalStorage } from '~/utils/formUtils';

export default function FormBuilderPage() {
  const { 
    fields, 
    steps, 
    activeStepId, 
    selectedFieldId, 
    formName,
    reorderFields, 
    setActiveStep 
  } = useFormBuilderStore();
  
  const fieldRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [shareLink, setShareLink] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);

  // Filter fields for the active step
  const activeStep = steps.find(step => step.id === activeStepId);
  const fieldsInActiveStep = activeStep
    ? fields.filter(field => activeStep.fieldIds.includes(field.id)).sort((a, b) => a.order - b.order)
    : [];

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    if (result.source.droppableId === 'field-toolbox' && result.destination.droppableId === 'form-preview') {
      // Logic handled in FieldToolbox component
    } else if (result.source.droppableId === 'form-preview' && result.destination.droppableId === 'form-preview') {
      // Reordering existing fields
      reorderFields(result.source.index, result.destination.index);
    }
  };

  const handleShareForm = async () => {
    try {
      // Validate form data
      if (!formName.trim()) {
        alert('Please provide a form name before sharing');
        return;
      }
      
      if (fields.length === 0) {
        alert('Please add at least one field to your form before sharing');
        return;
      }
      
      // Generate unique form ID
      const formId = generateFormId();
      console.log('Generated Form ID:', formId);
      
      // Prepare form data
      const formData = {
        formName: formName.trim(),
        fields: fields,
        steps: steps.length > 0 ? steps : []
      };
      
      console.log('Form data to save:', formData);
      
      // Save to localStorage
      saveFormToLocalStorage(formId, formData);
      
      // Generate share link
      const link = generateShareLink(formId);
      console.log('Generated share link:', link);
      setShareLink(link);
      
      // Try to copy to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(link);
          alert(`Form saved successfully!\n\nShare link copied to clipboard:\n${link}\n\nYou can now share this link with others to fill your form.`);
        } catch (clipboardError) {
          console.error('Failed to copy to clipboard:', clipboardError);
          setShowShareModal(true);
        }
      } else {
        // Fallback for browsers without clipboard API
        setShowShareModal(true);
      }
      
      console.log('Form shared successfully:', { formId, link, formData });
      
    } catch (error) {
      console.error('Error sharing form:', error);
      alert('Failed to save and share form. Please try again.');
    }
  };

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareLink);
        alert('Link copied to clipboard!');
      } else {
        // Manual copy fallback
        const textArea = document.createElement('textarea');
        textArea.value = shareLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Link copied to clipboard!');
      }
      setShowShareModal(false);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy link. Please copy manually.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header onShareForm={handleShareForm} />

      <main className="flex flex-1 overflow-hidden p-4 bg-gray-100 dark:bg-gray-800">
        {/* Left Sidebar: Field Toolbox */}
        <aside className="w-64 p-4 bg-white dark:bg-gray-700 rounded shadow-md mr-4 overflow-y-auto flex-shrink-0">
          <FieldToolbox />
        </aside>

        {/* Main Content: Form Preview */}
        <section className="flex-1 flex flex-col items-center">
          <div className="flex justify-center mb-4 space-x-2">
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`px-4 py-2 rounded-md ${previewMode === 'desktop' ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
            >
              Desktop
            </button>
            <button
              onClick={() => setPreviewMode('tablet')}
              className={`px-4 py-2 rounded-md ${previewMode === 'tablet' ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
            >
              Tablet
            </button>
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`px-4 py-2 rounded-md ${previewMode === 'mobile' ? 'bg-teal-500 text-white' : 'bg-gray-200 dark:bg-gray-600'}`}
            >
              Mobile
            </button>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div
              className={`bg-white dark:bg-gray-700 p-6 rounded shadow-lg overflow-y-auto transition-all duration-300 ${
                previewMode === 'desktop' ? 'w-full max-w-2xl' : ''
              } ${
                previewMode === 'tablet' ? 'w-[768px] max-w-full' : ''
              } ${
                previewMode === 'mobile' ? 'w-[375px] max-w-full' : ''
              }`}
              style={{ minHeight: '600px' }}
            >
              <h2 className="text-2xl font-bold mb-6 text-center">{formName || 'Untitled Form'}</h2>

              {/* Multi-step Navigation */}
              {steps.length > 1 && (
                <MultiStepNavigation
                  steps={steps}
                  activeStepId={activeStepId}
                  setActiveStep={setActiveStep}
                />
              )}

              <Droppable droppableId="form-preview">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="min-h-[300px] border-2 border-dashed border-gray-300 dark:border-gray-600 p-4 rounded-md"
                  >
                    {fieldsInActiveStep.length === 0 && (
                      <p className="text-gray-500 text-center py-8">Drag and drop fields here or click to add.</p>
                    )}
                    {fieldsInActiveStep.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(provided) => (
                          <div
                            ref={(el) => {
                              provided.innerRef(el);
                              fieldRefs.current[field.id] = el;
                            }}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`mb-4 p-3 border rounded-md cursor-pointer ${
                              selectedFieldId === field.id
                                ? 'border-teal-500 ring-2 ring-teal-300'
                                : 'border-gray-200 hover:border-teal-300 dark:border-gray-600 dark:hover:border-teal-400'
                            }`}
                            onClick={() => useFormBuilderStore.getState().setSelectedField(field.id)}
                          >
                            <FormPreview field={field} previewMode="builder" />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </DragDropContext>
        </section>

        {/* Right Sidebar: Field Properties */}
        <aside className="w-80 p-4 bg-white dark:bg-gray-700 rounded shadow-md ml-4 overflow-y-auto flex-shrink-0">
          <FieldPropertiesPanel />
        </aside>
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Form Shared Successfully!
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Your form has been saved. Share this link with others:
            </p>
            <div className="flex items-center space-x-2 mb-4">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-3 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 transition duration-200 text-sm"
              >
                Copy
              </button>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition duration-200"
              >
                Close
              </button>
              <a
                href={shareLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
              >
                Test Form
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}