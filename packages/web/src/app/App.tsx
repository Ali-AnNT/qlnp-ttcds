import { Providers } from "./providers";
import { AppRouter } from "./router";
import { ErrorBoundary } from "@/shared/ui/error-boundary";

export default function App() {
  return (
    <div className="qlnp-app">
      <ErrorBoundary>
        <Providers>
          <AppRouter />
        </Providers>
      </ErrorBoundary>
    </div>
  );
}