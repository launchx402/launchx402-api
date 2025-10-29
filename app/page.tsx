export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, -apple-system, sans-serif', 
      maxWidth: '900px', 
      margin: '0 auto', 
      padding: '40px 20px',
      lineHeight: '1.7',
      color: '#1a1a1a'
    }}>
      <header style={{ marginBottom: '50px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '600', marginBottom: '10px' }}>
          LaunchX402
        </h1>
        <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '0' }}>
          Launch Pump.fun tokens instantly with crypto payments
        </p>
      </header>

      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '20px' }}>API Endpoint</h2>
        
        <div style={{ 
          background: '#f8f9fa', 
          border: '1px solid #e0e0e0',
          padding: '25px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3 style={{ marginTop: '0', fontSize: '1.3rem', fontWeight: '600' }}>
            POST /api/create
          </h3>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Create and launch a new token on Pump.fun
          </p>
          
          <div style={{ marginBottom: '15px' }}>
            <strong>Cost:</strong> <span style={{ color: '#0066cc' }}>$5.00 USDC</span>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <strong>Method:</strong> POST (application/json)
          </div>

          <div>
            <strong>Required Parameters:</strong>
            <ul style={{ marginTop: '10px', color: '#555' }}>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>imageUrl</code> - Publicly accessible image URL</li>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>name</code> - Token name</li>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>symbol</code> - Token symbol</li>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>description</code> - Token description</li>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>amount</code> - Initial buy amount in SOL</li>
            </ul>
          </div>

          <div style={{ marginTop: '15px' }}>
            <strong>Optional Parameters:</strong>
            <ul style={{ marginTop: '10px', color: '#555' }}>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>twitter</code> - Twitter URL</li>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>telegram</code> - Telegram URL</li>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>website</code> - Website URL</li>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>slippage</code> - Slippage tolerance (default: 10)</li>
              <li><code style={{ background: '#fff', padding: '2px 6px', borderRadius: '3px' }}>priorityFee</code> - Priority fee in SOL (default: 0.0005)</li>
            </ul>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '20px' }}>How It Works</h2>
        <ol style={{ color: '#555', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '12px' }}>Make a POST request to <code style={{ background: '#f0f0f0', padding: '2px 6px', borderRadius: '3px' }}>/api/create</code> with token parameters</li>
          <li style={{ marginBottom: '12px' }}>Receive payment requirements (402 response)</li>
          <li style={{ marginBottom: '12px' }}>Complete USDC payment via x402 protocol</li>
          <li style={{ marginBottom: '12px' }}>Token is created and launched on Pump.fun</li>
          <li style={{ marginBottom: '12px' }}>Receive transaction signature and token details</li>
        </ol>
      </section>

      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '20px' }}>Example Request</h2>
        <pre style={{ 
          background: '#1e1e1e', 
          color: '#d4d4d4', 
          padding: '20px', 
          borderRadius: '6px', 
          overflow: 'auto',
          fontSize: '0.9rem',
          border: '1px solid #333'
        }}>
{`curl -X POST https://api.launchx402.fun/api/create \\
  -H "Content-Type: application/json" \\
  -d '{
    "imageUrl": "https://example.com/token-image.png",
    "name": "My Token",
    "symbol": "MTK",
    "description": "An amazing token",
    "amount": 1,
    "twitter": "https://x.com/mytoken",
    "website": "https://mytoken.com"
  }'`}
        </pre>
      </section>

      <section style={{ marginBottom: '50px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: '600', marginBottom: '20px' }}>Resources</h2>
        <ul style={{ listStyle: 'none', padding: '0' }}>
          <li style={{ marginBottom: '12px' }}>
            <a href="https://www.npmjs.com/package/@payai/x402-solana" target="_blank" rel="noopener noreferrer" 
               style={{ color: '#0066cc', textDecoration: 'none' }}>
              x402 Protocol Documentation
            </a>
          </li>
          <li style={{ marginBottom: '12px' }}>
            <a href="https://x402scan.com" target="_blank" rel="noopener noreferrer"
               style={{ color: '#0066cc', textDecoration: 'none' }}>
              x402scan
            </a>
          </li>
          <li style={{ marginBottom: '12px' }}>
            <a href="https://pumpportal.fun" target="_blank" rel="noopener noreferrer"
               style={{ color: '#0066cc', textDecoration: 'none' }}>
              PumpPortal API
            </a>
          </li>
        </ul>
      </section>

      <footer style={{ 
        borderTop: '1px solid #e0e0e0', 
        paddingTop: '30px', 
        textAlign: 'center', 
        color: '#888',
        fontSize: '0.9rem'
      }}>
        <p>Powered by x402 Protocol and PumpPortal</p>
      </footer>
    </div>
  );
}
