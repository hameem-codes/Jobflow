import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.messageId = 1;
    this.resolvers = new Map();
    this.eventListeners = new Map();
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
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
    '--user-data-dir=C:\\temp\\chrome-profile-audit2',
    '--no-sandbox'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  
  const res = await fetch(`http://127.0.0.1:9222/json`);
  const data = await res.json();
  const pageTarget = data.find(t => t.type === 'page');
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  const cdp = new CDPClient(wsUrl);
  await cdp.connect();
  
  const errors = [];
  const failedRequests = [];

  cdp.on('Runtime.consoleAPICalled', (p) => {
      if (p.type === 'error' || p.type === 'warning') {
          const args = p.args.map(a => a.value || a.description).join(' ');
          if (p.type === 'error' || args.includes('Warning:')) {
              errors.push("Console " + p.type + ": " + args + " at " + p.stackTrace?.callFrames[0]?.url + ":" + p.stackTrace?.callFrames[0]?.lineNumber);
          }
      }
  });

  cdp.on('Runtime.exceptionThrown', (p) => {
      errors.push("Exception: " + (p.exceptionDetails.exception?.description || p.exceptionDetails.text));
  });

  cdp.on('Network.responseReceived', (p) => {
      const resp = p.response;
      if (resp.status >= 400) {
          failedRequests.push(p.type + " " + resp.url + " - " + resp.status);
      }
  });

  await cdp.send('Runtime.enable');
  await cdp.send('Network.enable');
  await cdp.send('Page.enable');

  const flows = [
    '/',
    '/auth?mode=signup',
    '/auth?mode=login',
    '/app',
    '/app/jobs',
    '/app/applications',
    '/app/resumes',
    '/app/settings'
  ];

  for (const flow of flows) {
      console.log("Visiting " + flow + "...");
      await cdp.send('Page.navigate', { url: "http://localhost:3000" + flow });
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
