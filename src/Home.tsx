import { useState, useEffect } from 'react';
import { MoonPayBuyWidget } from '@moonpay/moonpay-react';

const SIGNING_SERVER_URL = import.meta.env.VITE_SIGNING_SERVER_URL;

const handleGetSignature = async (url: string): Promise<string> => {
  const response = await fetch(`${SIGNING_SERVER_URL}/sign-url?url=${encodeURIComponent(url)}`);
  const { signature } = await response.json();
  return signature;
};

export default function Home() {
  const [ipHash, setIpHash] = useState<string | null>(null);

  useEffect(() => {
    // TEMPORARY: force a wrong hash to test enforcement
    setIpHash("wrongHashForTesting123==");
    
    // fetch(`${SIGNING_SERVER_URL}/get-ip-hash`)
    //   .then(res => res.json())
    //   .then(data => setIpHash(data.ipHash))
    //   .catch(err => console.error('Failed to get IP hash:', err));
  }, []);


  if (!ipHash) return <div>Loading...</div>;

  return (
    <MoonPayBuyWidget
      variant="overlay"
      baseCurrencyCode="usd"
      baseCurrencyAmount="100"
      defaultCurrencyCode="eth"
      allowedIpAddress={ipHash}
      onUrlSignatureRequested={handleGetSignature}
      onLogin={async () => console.log("Customer logged in!")}
      visible
    />
  );
}