Always use app components.
Always fix lint issues.
Remove the existing styling pattern and replace it with TailwindCSS.
In forms and modals, paired footer action buttons must span the full parent width equally.
In modals, use the primary button for the main action and the gold secondary button for the supporting/cancel action.
Any API-backed UI must include proper loading states and a visible error state with retry logic.
Use the shared `AppStateFeedback` component for page or section loading, empty, and error retry states unless a more specific existing app component is required.
Always use `AppDatePicker` instead of `AppInput type="date"` for date fields.
