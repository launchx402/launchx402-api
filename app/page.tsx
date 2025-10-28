export default function Home() {
  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif', 
      maxWidth: '800px', 
      margin: '50px auto', 
      padding: '20px',
      lineHeight: '1.6'
    }}>
      <h1>x402 Test API</h1>
      
      <p>
        A test API endpoint demonstrating the x402 payment protocol on Solana.
      </p>

      <h2>🔌 API Endpoints</h2>
      
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>GET /api/test</h3>
        <p><strong>Cost:</strong> $1.00 USDC</p>
        <p>Simple test endpoint with optional message parameter.</p>
        <code style={{ background: '#e0e0e0', padding: '5px', borderRadius: '3px' }}>
          GET /api/test?message=hello
        </code>
      </div>

      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '5px', marginBottom: '15px' }}>
        <h3>POST /api/test</h3>
        <p><strong>Cost:</strong> $2.50 USDC</p>
        <p>Advanced endpoint with multiple actions: echo, process, analyze</p>
        <code style={{ background: '#e0e0e0', padding: '5px', borderRadius: '3px' }}>
          POST /api/test
        </code>
      </div>

      <h2>📖 Documentation</h2>
      <ul>
        <li><a href="https://github.com/yourusername/x402-test-api/blob/main/QUICKSTART.md">Quick Start Guide</a></li>
        <li><a href="https://github.com/yourusername/x402-test-api/blob/main/app/api/test/README.md">Full API Documentation</a></li>
        <li><a href="https://github.com/yourusername/x402-test-api/blob/main/app/api/test/example-client.ts">Client Examples</a></li>
        <li><a href="https://github.com/yourusername/x402-test-api/blob/main/app/api/test/INTEGRATION.md">x402scan Integration</a></li>
      </ul>

      <h2>🧪 Try It</h2>
      <p>Make a request without payment (returns 402):</p>
      <pre style={{ background: '#1a1a1a', color: '#00ff00', padding: '15px', borderRadius: '5px', overflow: 'auto' }}>
        curl {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/test
      </pre>

      <h2>🔗 Resources</h2>
      <ul>
        <li><a href="https://www.npmjs.com/package/@payai/x402-solana" target="_blank">@payai/x402-solana</a></li>
        <li><a href="https://x402scan.com" target="_blank">x402scan</a></li>
        <li><a href="https://docs.solana.com" target="_blank">Solana Docs</a></li>
      </ul>

      <hr style={{ margin: '30px 0' }} />

      <p style={{ textAlign: 'center', color: '#666' }}>
        Built with x402-solana • Pay-per-use APIs on Solana
      </p>
    </div>
  );
}

