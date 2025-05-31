// app/routes/my-forms.$formId.responses.tsx

import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

// Simulate fetching submissions from a DB
const mockSubmissionsDb: { [formId: string]: any[] } = {
  "1234567890": [
    { id: "sub1", f1: "Alice Smith", f2: "alice@example.com", f3: "Hello, this is a test message.", f4: "true", f5: "2025-06-15", f6: "ABC Inc." },
    { id: "sub2", f1: "Bob Johnson", f2: "bob@test.com", f3: "Another message.", f4: "false", f5: "2025-07-01", f6: "" },
  ],
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
  const formId = params.formId;
  if (!formId) {
    throw new Response("Form ID not found", { status: 404 });
  }

  const submissions = mockSubmissionsDb[formId] || []; // Fetch from your database here

  return json({ formId, submissions });
};

export default function FormResponsesPage() {
  const { formId, submissions } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 p-8">
      <div className="bg-white dark:bg-gray-700 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Responses for Form ID: {formId}
        </h1>

        {submissions.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No submissions yet for this form.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Submission ID
                  </th>
                  {/* Dynamically render headers based on first submission's keys */}
                  {Object.keys(submissions[0] || {}).filter(key => key !== 'id').map(key => (
                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      {key.replace(/^f\d_/, '').replace(/([A-Z])/g, ' $1').trim()} {/* Basic label formatting */}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-700 divide-y divide-gray-200 dark:divide-gray-600">
                {submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      {submission.id}
                    </td>
                    {Object.keys(submission).filter(key => key !== 'id').map(key => (
                      <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {String(submission[key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}