import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID } from 'node:crypto';
import http from 'node:http';

const execFileAsync = promisify(execFile);

// Simple CDP client implementation
class CDPClient {
  constructor(port) {
    this.port = port;
    this.ws = null;
    this.messageId = 1;
    this.resolvers = new Map();
  }

  async connect() {
    const res = await fetch(`http://127.0.0.1:${this.port}/json/version`);
    const data = await res.json();
    const wsUrl = data.webSocketDebuggerUrl;
    
    return new Promise((resolve, reject) => {
      // Use dynamic import for Node's internal WebSocket (if available in this version, else we'd need a fallback)
      // Node 22+ has native WebSocket, Node 18/20 might not.
      // We can use a trick: HTTP upgrade if native WS is missing.
      // But let's assume we can use it since previous session did.
      this.ws = new WebSocket(wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = reject;
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.resolvers.has(msg.id)) {
          if (msg.error) this.resolvers.get(msg.id).reject(msg.error);
          else this.resolvers.get(msg.id).resolve(msg.result);
          this.resolvers.delete(msg.id);
        }
      };
    });
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
  console.log("Starting Chrome with CDP on port 9222...");
  const chromeProcess = execFile('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless',
    '--remote-debugging-port=9222',
    '--user-data-dir=C:\\temp\\chrome-profile',
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

  console.log("Navigating to auth page...");
  await sendTarget('Page.enable');
  await sendTarget('Page.navigate', { url: 'http://localhost:3000/auth?mode=signup' });
  await new Promise(r => setTimeout(r, 3000));

  const testEmail = `test-${Date.now()}@example.com`;
  
  console.log("Evaluating script to fill out signup...");
  await sendTarget('Runtime.enable');
  await sendTarget('Runtime.evaluate', {
    expression: `
      document.querySelector('input[type="email"]').value = '${testEmail}';
      document.querySelector('input[type="email"]').dispatchEvent(new Event('change', { bubbles: true }));
      document.querySelector('input[type="password"]').value = 'Password123!';
      document.querySelector('input[type="password"]').dispatchEvent(new Event('change', { bubbles: true }));
      const nameInput = document.querySelector('input[placeholder="Your name"]');
      if (nameInput) {
        nameInput.value = 'Test User';
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
      document.querySelector('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    `
  });

  console.log("Waiting for signup to complete and redirect to /app...");
  await new Promise(r => setTimeout(r, 4000));
  
  // Verify localStorage has no 'jobflow-authenticated' flag
  console.log("Verifying localStorage 'jobflow-authenticated' is absent...");
  const lsEval = await sendTarget('Runtime.evaluate', {
    expression: `localStorage.getItem("jobflow-authenticated")`,
    returnByValue: true
  });
  
  // parse the nested result
  const msg1 = JSON.parse(lsEval.result);
  console.log("localStorage check:", msg1.result.result.value);
  
  if (msg1.result.result.value === "true") {
      console.error("FAIL: jobflow-authenticated is still being set!");
      process.exit(1);
  } else {
      console.log("PASS: jobflow-authenticated is NOT set.");
  }

  console.log("Verifying cookies (app_session_id)...");
  const cookiesEval = await sendTarget('Network.getCookies');
  const cookiesMsg = JSON.parse(cookiesEval.result);
  const sessionCookie = cookiesMsg.result.cookies.find(c => c.name === 'app_session_id');
  if (sessionCookie) {
      console.log("PASS: app_session_id cookie is present.", sessionCookie.value.substring(0, 10) + "...");
  } else {
      console.error("FAIL: app_session_id cookie is missing!");
      process.exit(1);
  }

  // Refresh page
  console.log("Refreshing page...");
  await sendTarget('Page.reload');
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("Checking if still authenticated (hitting /api/auth/me directly from page)...");
  const authEval = await sendTarget('Runtime.evaluate', {
    expression: `fetch('/api/auth/me').then(r => r.status)`,
    awaitPromise: true,
    returnByValue: true
  });
  const authMsg = JSON.parse(authEval.result);
  if (authMsg.result.result.value === 200) {
      console.log("PASS: /api/auth/me returns 200 on refresh.");
  } else {
      console.error("FAIL: /api/auth/me returned", authMsg.result.result.value);
      process.exit(1);
  }
  
  console.log("Logging out...");
  // Simulate logout click by clicking the logout button if possible, 
  // but we modified Home.tsx to use fetch. We can trigger the fetch or click.
  await sendTarget('Runtime.evaluate', {
    expression: `
      // find settings button or just execute the logout fetch
      fetch('/api/auth/logout', { method: 'POST' }).then(() => {
         window.location.href = '/auth';
      });
    `,
    awaitPromise: true
  });
  
  await new Promise(r => setTimeout(r, 3000));
  
  console.log("Checking /api/auth/me after logout...");
  const postLogoutEval = await sendTarget('Runtime.evaluate', {
    expression: `fetch('/api/auth/me').then(r => r.status)`,
    awaitPromise: true,
    returnByValue: true
  });
  const postLogoutMsg = JSON.parse(postLogoutEval.result);
  if (postLogoutMsg.result.result.value === 401) {
      console.log("PASS: /api/auth/me returns 401 after logout.");
  } else {
      console.error("FAIL: /api/auth/me returned", postLogoutMsg.result.result.value);
      process.exit(1);
  }

  console.log("ALL VERIFICATIONS PASSED!");
  
  chromeProcess.kill();
  process.exit(0);
}

run().catch(console.error);
