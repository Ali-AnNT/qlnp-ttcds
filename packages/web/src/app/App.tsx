import { Providers } from "./providers";
import { AppRouter } from "./router";

export default function App() {
  return (
    <div className="qlnp-app">
      <Providers>
        <AppRouter />
      </Providers>
    </div>
  );
}