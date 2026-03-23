import { handleRazorpayWebhook } from './razorpay.js';

// Helper to get header
function getHeader(headers: any, name: string): string | undefined {
  if (typeof headers.get === 'function') {
    return headers.get(name);
  }
  return headers[name];
}

// Helper to parse JSON body
async function parseBody(req: any): Promise<any> {
  if (req.body) {
    return req.body;
  }

  if (req.on) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk: Buffer) => {
        data += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  }

  return req.json();
}

export async function handleWebhook(req: any): Promise<Response> {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ message: 'Method not allowed' }), { status: 405 });
    }

    const body = await parseBody(req);
    const signature = getHeader(req.headers, 'x-razorpay-signature');

    if (!signature) {
      console.error('[Webhook] Missing signature header');
      return new Response(JSON.stringify({ message: 'Missing signature' }), { status: 400 });
    }

    const result = await handleRazorpayWebhook(body, signature);

    return new Response(
      JSON.stringify(result),
      { status: result.success ? 200 : 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Webhook Handler] Error:', error);
    return new Response(
      JSON.stringify({ message: 'Webhook processing failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
