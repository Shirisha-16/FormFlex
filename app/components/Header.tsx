// app/components/Header.tsx
import { Link,} from '@remix-run/react';
import { useFormBuilderStore } from '~/store/formBuilderStore';

interface HeaderProps {
  onShareForm: () => void;
}

export default function Header({ onShareForm }: HeaderProps) {
  const { formName, setFormName, toggleTheme, theme, undo, redo, past, future,clearForm } = useFormBuilderStore();
  
  const handleClearForm = () => {
    // Add a confirmation dialog before clearing the form
    if (window.confirm('Are you sure you want to clear the entire form? This action cannot be undone (except by Undo button).')) {
      clearForm();
    }
  };
  return (
    <header className="bg-teal-600 dark:bg-teal-800 text-white p-4 shadow-md flex justify-between items-center flex-wrap gap-2">
      <div className="flex items-center gap-4">
        <img src="/Icon.jpeg"
          alt="FormBuilder Icon"
          width={40}
          height={40}
          className="w-10 h-10 rounded"
          loading="lazy"/>
        <Link to="/" className="text-xl font-bold mr-4">
          Form Flex
        </Link>
        <input
          type="text"
          value={formName}
          onChange={(e) => setFormName(e.target.value)}
          className="bg-teal-300 dark:bg-teal-600 text-black rounded px-3 py-1 focus:outline-none focus:ring-2  focus:ring-teal-300"
          aria-label="Form Name"
        />
      </div>
      <div className="flex items-center space-x-3">
        <button
          onClick={undo}
          disabled={past.length === 0}
          className="px-3 py-1 rounded bg-teal-700 dark:bg-teal-900 hover:bg-teal-500 dark:hover:bg-teal-500 disabled:opacity-50"
          aria-label="Undo"
        >
          Undo
        </button>
        <button
          onClick={redo}
          disabled={future.length === 0}
          className="px-3 py-1 rounded bg-teal-700 dark:bg-teal-900 hover:bg-teal-500 dark:hover:bg-teal-500 disabled:opacity-50"
          aria-label="Redo"
        >
          Redo
        </button>
        <button
          onClick={toggleTheme}
          // Conditional classes: if theme is light, button looks light; if theme is dark, button looks dark
          className={`px-3 py-1 rounded transition-colors duration-200 ${
            theme === 'light'
              ? 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm' // Light mode: button appears light
              : 'bg-gray-700 text-white hover:bg-gray-600 shadow-sm'   // Dark mode: button appears dark
          }`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
         <button
          onClick={handleClearForm}
          className="px-4 py-2 bg-teal-500 rounded hover:bg-red-400 transition duration-200 shadow-md"
          aria-label="Clear all fields from the form"
          title="Clear Form"
        >
          Clear Form
        </button>
        <button
          onClick={onShareForm}
          className="px-4 py-2 bg-teal-500 rounded hover:bg-teal-600 transition duration-200"
        >
          Share Form
        </button>
      </div>
    </header>
  );
}