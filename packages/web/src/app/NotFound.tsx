import { useLocation, Link } from "react-router";
import { useEffect } from "react";
import { ROUTES } from "./routes";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="lma-flex lma-min-h-screen lma-items-center lma-justify-center lma-bg-muted">
      <div className="lma-text-center">
        <h1 className="lma-mb-4 lma-text-4xl lma-font-bold">404</h1>
        <p className="lma-mb-4 lma-text-xl lma-text-muted-foreground">Oops! Page not found</p>
        <Link to={ROUTES.layout} className="lma-text-primary lma-underline hover:lma-text-primary/90">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
