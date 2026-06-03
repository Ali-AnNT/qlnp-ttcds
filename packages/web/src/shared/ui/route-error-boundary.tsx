import { isRouteErrorResponse, Link, useRouteError } from "react-router";

/**
 * Fallback UI for route-level errors thrown by data-router loaders/components.
 * Renders inside AppLayout's <Outlet />, so the sidebar/header stay visible
 * and only the failed route's content is replaced.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : "Lỗi không xác định";

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <div className="text-center space-y-3">
        <p className="text-destructive font-medium">Có lỗi khi tải trang</p>
        <p className="text-sm text-muted-foreground">{message}</p>
        <Link to="/" className="text-sm text-accent hover:underline">
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
