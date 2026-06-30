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
    <div className="lma-flex lma-items-center lma-justify-center lma-min-h-[400px] !lma-p-6">
      <div className="lma-text-center lma-space-y-3">
        <p className="lma-text-destructive lma-font-medium">Có lỗi khi tải trang</p>
        <p className="lma-text-sm lma-text-muted-foreground">{message}</p>
        <Link to="/" className="lma-text-sm lma-text-accent hover:lma-underline">
          Quay lại trang chủ
        </Link>
      </div>
    </div>
  );
}
