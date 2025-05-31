// app/utils/formUtils.ts

export const generateShareLink = (formId: string): string => {
  // Check if we're in the browser environment
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/fill-form/${formId}`;
  }
  
  // Fallback for server-side rendering
  // In production, replace this with your actual domain
  return `http://localhost:3000/fill-form/${formId}`;
};

export const generateFormId = (): string => {
  // Generate a unique form ID using timestamp and random string
  return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const saveFormToLocalStorage = (formId: string, formData: any): void => {
  if (typeof window !== 'undefined') {
    try {
      const existingForms = localStorage.getItem('formBuilder_savedForms');
      const forms = existingForms ? JSON.parse(existingForms) : {};
      
      forms[formId] = {
        ...formData,
        id: formId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      localStorage.setItem('formBuilder_savedForms', JSON.stringify(forms));
      console.log('Form saved to localStorage:', formId);
    } catch (error) {
      console.error('Error saving form to localStorage:', error);
      throw new Error('Failed to save form');
    }
  }
};

export const getFormFromLocalStorage = (formId: string): any | null => {
  if (typeof window !== 'undefined') {
    try {
      const existingForms = localStorage.getItem('formBuilder_savedForms');
      if (existingForms) {
        const forms = JSON.parse(existingForms);
        return forms[formId] || null;
      }
    } catch (error) {
      console.error('Error loading form from localStorage:', error);
    }
  }
  return null;
};