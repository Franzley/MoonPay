import { MoonPayProvider } from "@moonpay/moonpay-react";
import Home from './Home.tsx'

export default function App() {
  return (
    <MoonPayProvider apiKey={import.meta.env.VITE_MOONPAY_PUBLISHABLE_KEY} debug>
      <Home />
    </MoonPayProvider>
  );
}