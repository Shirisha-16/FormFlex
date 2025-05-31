// app/routes/fill-form.$formId.tsx
import { json, type LoaderFunctionArgs } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useLoaderData, Form } from "@remix-run/react";
import { AnyFormField, FormStep } from "~/store/formBuilderStore";
import FormPreview from "~/components/FormPreview";
import { useState, useEffect } from "react";

interface DropdownField extends Omit<AnyFormField, 'type'> {
  type: 'dropdown';
  options: Array<{ value: string; label: string }>;
}

interface FormData {
  formName: string;
  fields: AnyFormField[];
  steps: FormStep[];
}

// Fallback mock data for development/testing
const mockFormsDb: { [key: string]: FormData } = {
  "1234567890": {
    formName: "Contact Us Form",
    fields: [
      { id: "f1", type: "text", label: "Your Name", placeholder: "John Doe", required: true, order: 0, validation: {} },
      { id: "f2", type: "text", label: "Email", placeholder: "email@example.com", required: true, order: 1, validation: { pattern: "^\\S+@\\S+\\.\\S+$" } },
      { id: "f3", type: "textarea", label: "Message", placeholder: "Your message...", required: false, order: 2, validation: { maxLength: 500 } },
      { id: "f4", type: "checkbox", label: "Subscribe to Newsletter", required: false, order: 3, validation: {} },
      { id: "f5", type: "date", label: "Preferred Contact Date", required: false, order: 4, validation: {} },
      { id: "f6", type: "text", label: "Company Name", placeholder: "Acme Corp", required: false, order: 5, validation: {} },
    ],
    steps: [
      { id: "s1", name: "Contact Info", fieldIds: ["f1", "f2", "f3", "f4"] },
      { id: "s2", name: "Additional Details", fieldIds: ["f5", "f6"] }
    ]
  },
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const formId = params.formId;
  if (!formId) {
    throw new Response("Form ID not found", { status: 404 });
  }

  // We'll pass the formId to the client and let it handle localStorage
  // Server-side can't access localStorage, so we'll use mock data as fallback
  const fallbackFormData = mockFormsDb[formId] || null;

  return json({ formId, fallbackFormData });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const formId = params.formId;
  const formData = await request.formData();
  const submissionData = Object.fromEntries(formData);

  console.log(`Received submission for Form ID: ${formId}`);
  console.log("Submission Data:", submissionData);
  
  // In a real app, you might want to save submissions to localStorage or send to an API
  return json({ message: "Form submitted successfully!", data: submissionData }, { status: 200 });
};

export default function FormFiller() {
  const { formId, fallbackFormData } = useLoaderData<typeof loader>();
  const [formData, setFormData] = useState<FormData | null>(fallbackFormData);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string | null>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [formNotFound, setFormNotFound] = useState(false);

  // Load form data from localStorage on client-side
  useEffect(() => {
    try {
      const storedForms = localStorage.getItem('formBuilder_savedForms');
      if (storedForms) {
        const parsedForms = JSON.parse(storedForms);
        const localFormData = parsedForms[formId];
        
        if (localFormData) {
          // Ensure the form data has the correct structure
          const validatedFormData: FormData = {
            formName: localFormData.formName || 'Untitled Form',
            fields: localFormData.fields || [],
            steps: localFormData.steps || []
          };
          setFormData(validatedFormData);
        } else if (!fallbackFormData) {
          setFormNotFound(true);
        }
      } else if (!fallbackFormData) {
        setFormNotFound(true);
      }
    } catch (error) {
      console.error("Error loading form from localStorage:", error);
      if (!fallbackFormData) {
        setFormNotFound(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [formId, fallbackFormData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading form...</p>
        </div>
      </div>
    );
  }

  if (formNotFound || !formData) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">Form Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            The form you're looking for doesn't exist or has been removed.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Form ID: {formId}
          </p>
          <a 
            href="/" 
            className="mt-4 inline-block px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition duration-200"
          >
            Go Back Home
          </a>
        </div>
      </div>
    );
  }

  const { formName, fields, steps } = formData;
  
  // If no steps exist, create a default step with all fields
  const effectiveSteps = steps.length > 0 ? steps : [
    { id: 'default', name: 'Form', fieldIds: fields.map(f => f.id) }
  ];
  
  const activeStep = effectiveSteps[currentStepIndex];
  const fieldsInActiveStep = activeStep
    ? fields.filter(field => activeStep.fieldIds.includes(field.id)).sort((a, b) => a.order - b.order)
    : [];

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
    // Clear error for this field when it changes
    setFormErrors(prev => ({ ...prev, [fieldId]: null }));
  };

  const validateStep = (): boolean => {
    let isValid = true;
    const newErrors: Record<string, string | null> = {};

    fieldsInActiveStep.forEach(field => {
      const value = formValues[field.id] || '';
      let error: string | null = null;

      if (field.required && !value) {
        error = `${field.label} is required.`;
      } else if (field.type === 'text' || field.type === 'textarea') {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          error = `${field.label} must be at least ${field.validation.minLength} characters.`;
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          error = `${field.label} must be at most ${field.validation.maxLength} characters.`;
        }
        if (field.type === 'text' && field.validation.pattern) {
          try {
            const regex = new RegExp(field.validation.pattern);
            if (value && !regex.test(value)) {
              error = `${field.label} format is invalid.`;
            }
          } catch (e) {
            console.error("Invalid regex pattern:", field.validation.pattern);
            error = `Invalid validation pattern for ${field.label}.`;
          }
        }
      }
      newErrors[field.id] = error;
      if (error) isValid = false;
    });

    setFormErrors(newErrors);
    return isValid;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      if (currentStepIndex < effectiveSteps.length - 1) {
        setCurrentStepIndex(prev => prev + 1);
      }
    }
  };

  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const saveSubmissionToLocalStorage = (submissionData: Record<string, string>) => {
    try {
      const existingSubmissions = localStorage.getItem('formBuilder_submissions');
      const submissions = existingSubmissions ? JSON.parse(existingSubmissions) : {};
      
      if (!submissions[formId]) {
        submissions[formId] = [];
      }
      
      const submission = {
        id: Date.now().toString(),
        submittedAt: new Date().toISOString(),
        data: submissionData,
        formName: formName
      };
      
      submissions[formId].push(submission);
      
      localStorage.setItem('formBuilder_submissions', JSON.stringify(submissions));
      console.log("Submission saved to localStorage:", submission);
    } catch (error) {
      console.error("Error saving submission to localStorage:", error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep()) {
      // Save to localStorage
      saveSubmissionToLocalStorage(formValues);
      
      alert("Form Submitted Successfully! Data saved to local storage.");
      console.log("Form Data:", formValues);
      
      // Reset form
      setFormValues({});
      setCurrentStepIndex(0);
      setFormErrors({});
    } else {
      alert("Please fix the errors in the current step.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
          {formName}
        </h1>

        {/* Progress Indicator */}
        {effectiveSteps.length > 1 && (
          <div className="mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
              {effectiveSteps.map((step, index) => (
                <span key={step.id} className={index <= currentStepIndex ? 'text-teal-600' : ''}>
                  Step {index + 1}: {step.name}
                </span>
              ))}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-600">
              <div
                className="bg-teal-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStepIndex + 1) / effectiveSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <Form method="post" onSubmit={handleSubmit} className="space-y-4">
          {fieldsInActiveStep.map((field) => (
            <div key={field.id}>
              {field.type !== 'checkbox' && (
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
              )}

              {field.type === 'text' && (
                <input
                  type="text"
                  name={field.id}
                  placeholder={field.placeholder}
                  value={formValues[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  onBlur={() => validateStep()}
                  className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500
                    ${formErrors[field.id] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  name={field.id}
                  placeholder={field.placeholder}
                  value={formValues[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  onBlur={() => validateStep()}
                  rows={3}
                  className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500
                    ${formErrors[field.id] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                ></textarea>
              )}

              {field.type === 'dropdown' && (
                <select
                  name={field.id}
                  value={formValues[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  onBlur={() => validateStep()}
                  className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500
                    ${formErrors[field.id] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                >
                  <option value="">Select an option</option>
                  {(field as DropdownField).options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'date' && (
                <input
                  type="date"
                  name={field.id}
                  value={formValues[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  onBlur={() => validateStep()}
                  className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500
                    ${formErrors[field.id] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                />
              )}

              {field.type === 'checkbox' && (
                <div className="flex items-center mt-1">
                  <input
                    type="checkbox"
                    name={field.id}
                    checked={formValues[field.id] === 'true'}
                    onChange={(e) => {
                      handleFieldChange(field.id, e.target.checked ? 'true' : 'false');
                      validateStep();
                    }}
                    className="h-4 w-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500 dark:bg-gray-600 dark:border-gray-500 mr-2"
                  />
                  <span className="text-gray-900 dark:text-gray-100">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </span>
                </div>
              )}

              {field.type === 'fileUpload' && (
                <input
                  type="file"
                  name={field.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleFieldChange(field.id, file ? file.name : '');
                  }}
                  onBlur={() => validateStep()}
                  className={`mt-1 block w-full p-2 border rounded-md shadow-sm focus:ring-teal-500 focus:border-teal-500
                    ${formErrors[field.id] ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
                    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                />
              )}

              {formErrors[field.id] && (
                <p className="mt-1 text-sm text-red-500">{formErrors[field.id]}</p>
              )}
            </div>
          ))}

          <div className="flex justify-between mt-6">
            {currentStepIndex > 0 && (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition duration-200"
              >
                Previous
              </button>
            )}

            {currentStepIndex < effectiveSteps.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition duration-200 ml-auto"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition duration-200 ml-auto"
              >
                Submit Form
              </button>
            )}
          </div>
        </Form>
      </div>
    </div>
  );
}