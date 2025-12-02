import { AppRouter } from './router';

/**
 * App - Root application component
 *
 * This component serves as the root of the React application.
 * It wraps the AppRouter which handles all routing logic.
 *
 * Future additions may include:
 * - Global error boundaries
 * - Context providers (theme, etc.)
 * - Analytics initialization
 */
function App() {
  return <AppRouter />;
}

export default App;
