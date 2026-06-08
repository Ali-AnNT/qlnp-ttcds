import { ErrorBoundary } from "@/shared/ui/error-boundary";
import { RouterProvider } from "react-router/dom";
import { Providers } from "./providers";
import { router } from "./router";

export default function App() {
  return (
    <div>
      <ErrorBoundary>
        <Providers>
          <RouterProvider router={router} />
        </Providers>
      </ErrorBoundary>
    </div>
  );
}
