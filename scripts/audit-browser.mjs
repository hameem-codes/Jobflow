import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

class CDPClient {
  constructor(port) {
    this.port = port;
    this.ws = null;
    this.messageId = 1;
    this.resolvers = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    const res = await fetch(`http://127.0.0.1:${this.port}/json/version`);
    const data = await res.json();
    const wsUrl = data.webSocketDebuggerUrl;
    
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.method) {
            const listeners = this.eventListeners.get(msg.method) || [];
            listeners.forEach(l => l(msg.params));
        }
        if (msg.id && this.resolvers.has(msg.id)) {
          if (msg.error) this.resolvers.get(msg.id).reject(msg.error);
          else this.resolvers.get(msg.id).resolve(msg.result);
          this.resolvers.delete(msg.id);
        }
      };
    });
  }

  on(method, callback) {
      if (!this.eventListeners.has(method)) this.eventListeners.set(method, []);
      this.eventListeners.get(method).push(callback);
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.messageId++;
      this.resolvers.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function run() {
  const browserPort = 9222;
  const chromeProcess = execFile('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\temp\\chrome-profile-audit',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  
  const cdp = new CDPClient(browserPort);
  await cdp.connect();
  
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });
  
  const sendTarget = (method, params) => cdp.send('Target.sendMessageToTarget', {
    sessionId,
    message: JSON.stringify({ id: cdp.messageId++, method, params })
  });

  const errors = [];
  const failedRequests = [];

  // Capture console errors
  cdp.on('Target.receivedMessageFromTarget', (msg) => {
    if (msg.sessionId !== sessionId) return;
    const parsed = JSON.parse(msg.message);
    if (parsed.method === 'Runtime.consoleAPICalled') {
        const p = parsed.params;
        if (p.type === 'error' || p.type === 'warning') {
            const args = p.args.map(a => a.value || a.description).join(' ');
            if (p.type === 'error' || args.includes('Warning:')) { // react warnings usually start with Warning:
                errors.push(`Console ${p.type}: ${args} at ${p.stackTrace?.callFrames[0]?.url}:${p.stackTrace?.callFrames[0]?.lineNumber}`);
            }
        }
    } else if (parsed.method === 'Runtime.exceptionThrown') {
        errors.push(`Exception: ${parsed.params.exceptionDetails.exception?.description || parsed.params.exceptionDetails.text}`);
    } else if (parsed.method === 'Network.responseReceived') {
        const resp = parsed.params.response;
        if (resp.status >= 400) {
            failedRequests.push(`${parsed.params.type} ${resp.url} - ${resp.status}`);
        }
    }
  });

  await sendTarget('Runtime.enable');
  await sendTarget('Network.enable');
  await sendTarget('Page.enable');

  const flows = [
    '/',
    '/auth',
    '/app',
    '/app/jobs',
    '/app/applications',
    '/app/resumes',
    '/app/settings'
  ];

  for (const flow of flows) {
      console.log("Visiting " + flow + "...");
      await sendTarget('Page.navigate', { url: "http://localhost:3000" + flow });
      await new Promise(r => setTimeout(r, 2500));
  }

  console.log("=== BROWSER CONSOLE ERRORS ===");
  errors.forEach(e => console.log(e));
  console.log("=== FAILED NETWORK REQUESTS ===");
  failedRequests.forEach(r => console.log(r));

  chromeProcess.kill();
  process.exit(0);
}

run().catch(console.error);
