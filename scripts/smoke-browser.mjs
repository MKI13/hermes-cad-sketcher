#!/usr/bin/env node

import { spawn, execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import net from 'node:net';

const previewPort = Number(process.env.SMOKE_PREVIEW_PORT ?? 4173);
const previewUrl = `http://127.0.0.1:${previewPort}`;
const chromiumExecutable = process.env.CHROMIUM_PATH ?? '/snap/bin/chromium';
const visualEvidenceDir = process.env.SMOKE_VISUAL_DIR ?? path.join(process.cwd(), 'tmp', 'visual-smoke');

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
    server.on('error', reject);
  });
}

async function waitForHttp(url, timeoutMs = 30_000, isProcessAlive = () => true) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    if (!isProcessAlive()) throw lastError ?? new Error(`${url} was not reachable before the process exited`);
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      lastError = new Error(`${url} returned ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(250);
  }
  throw lastError ?? new Error(`${url} was not reachable`);
}

function startProcess(command, args) {
  const child = spawn(command, args, { cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], detached: true });
  child.stdout.on('data', (chunk) => { if (process.env.SMOKE_VERBOSE) process.stderr.write(chunk); });
  child.stderr.on('data', (chunk) => { if (process.env.SMOKE_VERBOSE) process.stderr.write(chunk); });
  return child;
}

function childPids(pid) {
  try {
    const output = execFileSync('pgrep', ['-P', String(pid)], { encoding: 'utf8' }).trim();
    return output ? output.split(/\s+/).map(Number) : [];
  } catch {
    return [];
  }
}

function descendantPids(pid) {
  const direct = childPids(pid);
  return direct.flatMap((childPid) => [childPid, ...descendantPids(childPid)]);
}

function signalProcessFamily(child, signal) {
  if (!child) return;
  try {
    process.kill(-child.pid, signal);
    return;
  } catch {
    // Fall back to PID tree when the process group no longer exists.
  }
  for (const pid of [child.pid, ...descendantPids(child.pid)]) {
    try { process.kill(pid, signal); } catch {}
  }
}

async function stopProcess(child) {
  if (!child) return;
  signalProcessFamily(child, 'SIGTERM');
  await Promise.race([
    child.exitCode !== null || child.signalCode !== null
      ? Promise.resolve()
      : new Promise((resolve) => child.once('exit', resolve)),
    wait(2500)
  ]);
  signalProcessFamily(child, 'SIGKILL');
}

function attachExitCleanup(children) {
  const cleanup = () => {
    for (const child of children) signalProcessFamily(child, 'SIGTERM');
  };
  process.once('exit', cleanup);
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.once(signal, () => {
      cleanup();
      process.exit(signal === 'SIGINT' ? 130 : 143);
    });
  }
}

async function findPageTarget(debugPort, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let tabs = [];
  while (Date.now() < deadline) {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
    tabs = await response.json();
    const page = tabs.find((tab) => tab.type === 'page' && tab.webSocketDebuggerUrl);
    if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    await wait(250);
  }
  throw new Error(`Could not find Chromium page target: ${JSON.stringify(tabs)}`);
}

async function openProtocolSocket(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  let nextId = 1;
  const callbacks = new Map();
  const events = [];
  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && callbacks.has(message.id)) {
      callbacks.get(message.id)(message);
      callbacks.delete(message.id);
    } else if (message.method) {
      events.push(message);
    }
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++;
    callbacks.set(id, (message) => {
      if (message.error) reject(new Error(`${method} failed: ${JSON.stringify(message.error)}`));
      else resolve(message.result ?? {});
    });
    socket.send(JSON.stringify({ id, method, params }));
  });
  return { socket, send, events };
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(`Browser evaluation failed: ${JSON.stringify(result.exceptionDetails)}`);
  return result.result?.value;
}

async function waitForApp(cdp, timeoutMs = 30_000) {
  const deadline = Date.now() + timeoutMs;
  let lastState;
  while (Date.now() < deadline) {
    lastState = await evaluate(cdp, `(() => {
      const text = document.body?.innerText ?? '';
      return {
        ready: text.includes('Hermes CAD Sketcher') && (document.querySelector('canvas') || text.includes('3D-Viewport nicht verfügbar')),
        title: document.title,
        text: text.slice(0, 1000),
        canvasCount: document.querySelectorAll('canvas').length,
        webglFallback: text.includes('3D-Viewport nicht verfügbar')
      };
    })()`);
    if (lastState?.ready) return lastState;
    await wait(250);
  }
  throw new Error(`App did not become ready: ${JSON.stringify(lastState)}`);
}

function relevantEvents(events) {
  return events
    .filter((event) => ['Runtime.exceptionThrown', 'Log.entryAdded', 'Network.loadingFailed', 'Network.responseReceived'].includes(event.method))
    .map((event) => {
      if (event.method === 'Network.responseReceived') {
        return { method: event.method, url: event.params?.response?.url, status: event.params?.response?.status, mimeType: event.params?.response?.mimeType };
      }
      if (event.method === 'Runtime.exceptionThrown') {
        return {
          method: event.method,
          text: event.params?.exceptionDetails?.text,
          url: event.params?.exceptionDetails?.url,
          description: event.params?.exceptionDetails?.exception?.description,
          message: event.params?.exceptionDetails?.exception?.preview?.properties?.find((property) => property.name === 'message')?.value
        };
      }
      return event;
    })
    .slice(-50);
}

function isExpectedWebGLContextException(event) {
  if (event.method !== 'Runtime.exceptionThrown') return false;
  const details = event.params?.exceptionDetails;
  const description = details?.exception?.description ?? '';
  const message = details?.exception?.preview?.properties?.find((property) => property.name === 'message')?.value ?? '';
  return details?.url?.includes('/assets/three-') &&
    details?.text === 'Uncaught' &&
    (description.includes('Error creating WebGL context.') || message === 'Error creating WebGL context.');
}

function isExpectedRenderingWarning(event) {
  if (event.method !== 'Log.entryAdded') return false;
  const entry = event.params?.entry;
  return entry?.source === 'rendering' &&
    entry?.level === 'warning' &&
    typeof entry?.text === 'string' &&
    entry.text.includes('GPU stall due to ReadPixels');
}

async function setViewport(cdp, viewport) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: viewport.deviceScaleFactor,
    mobile: viewport.mobile
  });
  await cdp.send('Emulation.setVisibleSize', { width: viewport.width, height: viewport.height });
}

async function captureScreenshot(cdp, name) {
  await mkdir(visualEvidenceDir, { recursive: true });
  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
  const filePath = path.join(visualEvidenceDir, `${name}.png`);
  await writeFile(filePath, Buffer.from(screenshot.data, 'base64'));
  return filePath;
}

function visualCheckScript(viewportName) {
  return `(async () => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const viewportWidth = document.documentElement.clientWidth;
    const text = document.body.innerText;
    const visible = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return false;
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const overflowElements = Array.from(document.querySelectorAll('body *')).map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        className: String(element.className),
        text: (element.textContent || '').trim().slice(0, 80),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        width: Math.round(rect.width),
        position: style.position,
        overflowX: style.overflowX
      };
    }).filter((item) => item.width > 0 && item.position !== 'fixed' && (item.left < -2 || item.right > viewportWidth + 2)).slice(0, 20);
    const toolbar = document.querySelector('.toolbar')?.getBoundingClientRect();
    const workspace = document.querySelector('.workspace')?.getBoundingClientRect();
    const statusbar = document.querySelector('.statusbar')?.getBoundingClientRect();
    const viewport = document.querySelector('.three-viewport')?.getBoundingClientRect();
    const viewportTop = viewport?.top ?? Number.POSITIVE_INFINITY;
    const viewportBottom = viewport?.bottom ?? Number.NEGATIVE_INFINITY;
    const aboveTheFold = viewport ? viewportTop < window.innerHeight && viewportBottom > 0 : false;
    const documentVerticalOverflow = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const failures = [];
    if (!visible('.toolbar')) failures.push('toolbar not visible');
    if (!visible('.workspace')) failures.push('workspace not visible');
    if (!visible('.statusbar')) failures.push('statusbar not visible');
    if (!visible('.three-viewport')) failures.push('viewport not visible');
    if (!text.includes('Einheit: mm')) failures.push('unit status missing');
    if (!text.includes('Projekt: Projekt nicht gespeichert')) failures.push('project status missing');
    if (!text.includes('3D-Arbeitsfläche')) failures.push('3D workspace cue missing');
    if (document.documentElement.scrollWidth > viewportWidth + 2) failures.push('document has horizontal overflow');
    if (overflowElements.length > 0) failures.push('elements overflow viewport horizontally');
    return {
      viewportName: ${JSON.stringify(viewportName)},
      ok: failures.length === 0,
      failures,
      layoutGeometry: {
        horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - viewportWidth),
        viewportWidth,
        documentScrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        toolbar: toolbar ? { width: Math.round(toolbar.width), height: Math.round(toolbar.height) } : null,
        workspace: workspace ? { width: Math.round(workspace.width), height: Math.round(workspace.height) } : null,
        statusbar: statusbar ? { width: Math.round(statusbar.width), height: Math.round(statusbar.height) } : null,
        viewport: viewport ? { width: Math.round(viewport.width), height: Math.round(viewport.height), top: Math.round(viewport.top), bottom: Math.round(viewport.bottom), aboveTheFold } : null,
        documentVerticalOverflow,
        overflowElements
      }
    };
  })()`;
}

async function runVisualChecks(cdp) {
  const viewports = [
    { name: 'desktop', width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false },
    { name: 'mobile', width: 390, height: 1200, deviceScaleFactor: 1, mobile: true }
  ];
  const screenshots = [];
  const checks = [];
  for (const viewport of viewports) {
    await setViewport(cdp, viewport);
    await cdp.send('Page.navigate', { url: previewUrl });
    await waitForApp(cdp);
    const check = await evaluate(cdp, visualCheckScript(viewport.name));
    const screenshotPath = await captureScreenshot(cdp, viewport.name);
    screenshots.push({ viewport: viewport.name, path: screenshotPath });
    checks.push(check);
  }
  const failures = checks.flatMap((check) => check.ok ? [] : check.failures.map((failure) => `${check.viewportName}: ${failure}`));
  if (failures.length > 0) {
    throw new Error(`Visual smoke failed: ${JSON.stringify({ failures, checks, screenshots })}`);
  }
  return { screenshots, checks };
}

async function main() {
  const preview = startProcess('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(previewPort), '--strictPort']);
  const chromiumDataDir = await mkdtemp(path.join(tmpdir(), 'hermes-cad-smoke-chrome-'));
  let chromium;
  let protocol;
  attachExitCleanup([preview]);
  try {
    await waitForHttp(previewUrl, 30_000, () => preview.exitCode === null && preview.signalCode === null);

    const debugPort = await getFreePort();
    chromium = startProcess(chromiumExecutable, [
      '--headless=new',
      `--remote-debugging-address=127.0.0.1`,
      `--remote-debugging-port=${debugPort}`,
      `--user-data-dir=${chromiumDataDir}`,
      '--enable-unsafe-swiftshader',
      '--use-angle=swiftshader-webgl',
      '--disable-background-networking',
      '--disable-component-update',
      '--disable-domain-reliability',
      '--disable-sync',
      '--no-first-run',
      '--no-default-browser-check',
      'about:blank'
    ]);
    attachExitCleanup([chromium]);
    await waitForHttp(`http://127.0.0.1:${debugPort}/json/version`, 30_000, () => chromium.exitCode === null && chromium.signalCode === null);

    protocol = await openProtocolSocket(await findPageTarget(debugPort));
    await protocol.send('Runtime.enable');
    await protocol.send('Log.enable');
    await protocol.send('Network.enable');
    await protocol.send('Page.enable');
    await protocol.send('DOM.enable');
    await setViewport(protocol, { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
    await protocol.send('Page.navigate', { url: previewUrl });

    const readyState = await waitForApp(protocol);
    const result = await evaluate(protocol, `(async () => {
      const failures = [];
      const text = () => document.body.innerText;
      const clickByText = (selector, label) => {
        const element = Array.from(document.querySelectorAll(selector)).find((node) => node.textContent.includes(label));
        if (!element) {
          failures.push('Missing control: ' + label);
          return;
        }
        element.click();
      };
      const afterFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      ['Hermes CAD Sketcher', 'Auswahl', 'Linie', 'Quadrat/Rechteck', 'Körper', 'Rückgängig', 'Wiederholen', 'Auswahl löschen', 'Projekt speichern', 'DXF exportieren', 'STL exportieren'].forEach((label) => {
        if (!text().includes(label)) failures.push('Missing visible label: ' + label);
      });
      const before = text();
      if (!document.querySelector('canvas') && !text().includes('3D-Viewport nicht verfügbar')) failures.push('No canvas or WebGL fallback rendered');
      clickByText('button', 'Körper');
      await afterFrame();
      if (!text().includes('Werkzeug: box')) failures.push('Box tool click did not update statusbar');
      clickByText('button', 'Auswahl');
      await afterFrame();
      if (!text().includes('Werkzeug: select')) failures.push('Select tool click did not update statusbar');
      if (!before.includes('Aktuelle Elemente: 2')) failures.push('Initial model count was not visible');
      return { ok: failures.length === 0, failures, canvasCount: document.querySelectorAll('canvas').length, webglFallback: text().includes('3D-Viewport nicht verfügbar') };
    })()`);
    if (!result?.ok) throw new Error(`Browser smoke failed: ${JSON.stringify(result?.failures ?? result)}`);

    const visualEvidence = await runVisualChecks(protocol);

    const badEvents = protocol.events.filter((event) => {
      if (event.method === 'Runtime.exceptionThrown') return !readyState.webglFallback || !isExpectedWebGLContextException(event);
      if (event.method === 'Log.entryAdded') {
        if (isExpectedRenderingWarning(event)) return false;
        const entry = event.params?.entry;
        if (entry?.url?.endsWith('/favicon.ico')) return false;
        return ['error', 'warning'].includes(entry?.level);
      }
      if (event.method === 'Network.loadingFailed') return true;
      return false;
    });
    if (badEvents.length > 0) throw new Error(`Console/runtime errors during smoke: ${JSON.stringify(relevantEvents(badEvents))}`);

    console.log(JSON.stringify({
      ok: true,
      url: previewUrl,
      rendering: result.webglFallback ? 'webgl-fallback' : 'webgl-canvas',
      visualEvidence,
      checks: [
        'app loaded',
        'no unexpected console/runtime errors',
        'core controls visible',
        'tool button interaction updates statusbar',
        'desktop visual geometry has no horizontal overflow',
        'mobile visual geometry has no horizontal overflow',
        'desktop and mobile screenshots captured'
      ]
    }, null, 2));
  } finally {
    if (protocol?.socket) {
      protocol.socket.close();
      if (protocol.socket.readyState !== WebSocket.CLOSED) {
        await Promise.race([
          new Promise((resolve) => protocol.socket.addEventListener('close', resolve, { once: true })),
          wait(1000)
        ]);
      }
    }
    if (chromium) await stopProcess(chromium);
    await stopProcess(preview);
    await rm(chromiumDataDir, { recursive: true, force: true });
  }
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exit(1);
});
