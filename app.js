/* ----------------------------------------------------
   NetScope Premium JS Controller - Vanilla JS Redesign
   ---------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
  
  // --- Global State & Configuration ---
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isCanvasRunning = !isReducedMotion;

  // --- Theme Toggle ---
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
  });

  // --- Mobile Navigation Menu ---
  const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
  const navLinksWrapper = document.querySelector('.nav-links-wrapper');
  
  mobileNavToggle.addEventListener('click', () => {
    const expanded = mobileNavToggle.getAttribute('aria-expanded') === 'true';
    mobileNavToggle.setAttribute('aria-expanded', !expanded);
    mobileNavToggle.classList.toggle('active');
    navLinksWrapper.classList.toggle('active');
  });

  // Close nav on clicking links
  document.querySelectorAll('.nav-link, .nav-btn').forEach(link => {
    link.addEventListener('click', () => {
      mobileNavToggle.setAttribute('aria-expanded', 'false');
      mobileNavToggle.classList.remove('active');
      navLinksWrapper.classList.remove('active');
    });
  });

  // --- High-Performance 3D Scrollable Network Background Canvas ---
  const canvas = document.getElementById('network-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
  
  const nodes = [];
  const maxNodes = Math.min(65, Math.floor((width * height) / 20000)); // Optimal node density
  
  class Node3D {
    constructor() {
      this.x = (Math.random() - 0.5) * 850;
      this.y = (Math.random() - 0.5) * 850;
      this.z = (Math.random() - 0.5) * 850;
      this.radius = Math.random() * 2 + 1.5;
      
      // Slow drift speeds
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.vz = (Math.random() - 0.5) * 0.35;
    }
    
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.z += this.vz;
      
      const bounds = 450;
      if (Math.abs(this.x) > bounds) this.vx *= -1;
      if (Math.abs(this.y) > bounds) this.vy *= -1;
      if (Math.abs(this.z) > bounds) this.vz *= -1;
    }
  }

  // Create initial nodes
  for (let i = 0; i < maxNodes; i++) {
    nodes.push(new Node3D());
  }

  let rotationY = 0;
  let rotationX = 0;
  let targetRotationY = 0;
  let targetRotationX = 0;
  
  window.addEventListener('scroll', () => {
    const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
    targetRotationY = scrollPercent * Math.PI * 1.6; 
    targetRotationX = scrollPercent * Math.PI * 0.5;
  }, { passive: true });

  function rotateCoordinates(node, angleX, angleY) {
    const cosX = Math.cos(angleX);
    const sinX = Math.sin(angleX);
    let y1 = node.y * cosX - node.z * sinX;
    let z1 = node.z * cosX + node.y * sinX;
    
    const cosY = Math.cos(angleY);
    const sinY = Math.sin(angleY);
    let x2 = node.x * cosY + z1 * sinY;
    let z2 = z1 * cosY - node.x * sinY;
    
    return { x: x2, y: y1, z: z2 };
  }

  const fov = 400; // Focal length
  
  function render() {
    if (!isCanvasRunning) return;
    
    ctx.clearRect(0, 0, width, height);
    
    rotationY += (targetRotationY - rotationY) * 0.05;
    rotationX += (targetRotationX - rotationX) * 0.05;
    
    const projectedNodes = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    const isLightTheme = document.documentElement.getAttribute('data-theme') !== 'dark'; // Light by default
    
    // Upgraded Visibility: Brighter opacity & thicker lines for visibility on both themes
    const dotColor = isLightTheme ? 'rgba(99, 102, 241, 0.35)' : 'rgba(0, 220, 255, 0.45)';
    const lineColor = isLightTheme ? 'rgba(99, 102, 241, 0.08)' : 'rgba(139, 92, 246, 0.15)';
    const lineWeight = isLightTheme ? 1.0 : 1.25;
    
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      node.update();
      
      const rotated = rotateCoordinates(node, rotationX, rotationY);
      const cameraZ = rotated.z + 650;
      
      if (cameraZ > 0) {
        const scale = fov / cameraZ;
        const projX = rotated.x * scale + centerX;
        const projY = rotated.y * scale + centerY;
        
        projectedNodes.push({
          x: projX,
          y: projY,
          scale: scale,
          z: rotated.z
        });
      }
    }
    
    // Draw lines
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWeight;
    for (let i = 0; i < projectedNodes.length; i++) {
      for (let j = i + 1; j < projectedNodes.length; j++) {
        const n1 = projectedNodes[i];
        const n2 = projectedNodes[j];
        
        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 180) {
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
        }
      }
    }
    ctx.stroke();
    
    // Draw dots
    for (let i = 0; i < projectedNodes.length; i++) {
      const p = projectedNodes[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.scale * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = dotColor;
      ctx.fill();
    }
    
    requestAnimationFrame(render);
  }

  // Viewport Observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      isCanvasRunning = entry.isIntersecting && !isReducedMotion;
      if (isCanvasRunning) render();
    });
  }, { threshold: 0.1 });
  
  observer.observe(canvas);

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }, 200);
  });

  if (isCanvasRunning) render();
  }


  // --- 3D Interactive Device Tilt (Enlarged phone, smoother movement) ---
  const deviceWrapper = document.getElementById('device-wrapper');
  const deviceMockup = document.getElementById('device-mockup');
  
  if (deviceWrapper && deviceMockup && !isReducedMotion) {
    let tiltX = 0;
    let tiltY = 0;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let scrollRotation = 0;
    let targetScrollRotation = 0;
    
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      targetScrollRotation = scrollY * 0.05; // Gentle rotation scroll response
    }, { passive: true });
    
    deviceWrapper.parentElement.addEventListener('mousemove', (e) => {
      const rect = deviceWrapper.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      targetTiltY = (mouseX / (rect.width / 2)) * 15; // Limit tilt for smoothness
      targetTiltX = -(mouseY / (rect.height / 2)) * 15;
    });
    
    deviceWrapper.parentElement.addEventListener('mouseleave', () => {
      targetTiltX = 0;
      targetTiltY = 0;
    });
    
    function updateDeviceTilt() {
      // Smooth linear interpolation (lerp)
      tiltX += (targetTiltX - tiltX) * 0.08;
      tiltY += (targetTiltY - tiltY) * 0.08;
      scrollRotation += (targetScrollRotation - scrollRotation) * 0.1;
      
      deviceMockup.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY + scrollRotation}deg)`;
      
      requestAnimationFrame(updateDeviceTilt);
    }
    
    requestAnimationFrame(updateDeviceTilt);
  }

  // --- Real-Time Screenshot app UI updates ---
  const appRadarValue = document.getElementById('app-radar-value');
  const gridRSRPValue = document.getElementById('grid-rsrp-val');
  const gridRSRPFill = document.getElementById('grid-rsrp-fill');
  
  const gridRSRQValue = document.getElementById('grid-rsrq-val');
  const gridRSRQFill = document.getElementById('grid-rsrq-fill');
  
  const gridSINRValue = document.getElementById('grid-sinr-val');
  const gridSINRFill = document.getElementById('grid-sinr-fill');
  
  function updateTelemetryDashboard(rsrp, rsrq, sinr, carrier, pci) {
    let status = "CRITICAL";
    let statusClass = "critical"; // maps to critical, low, optimal in CSS
    
    if (rsrp >= -95) {
      status = "OPTIMAL";
      statusClass = "optimal";
    } else if (rsrp >= -108) {
      status = "LOW QUALITY";
      statusClass = "low";
    } else {
      status = "CRITICAL";
      statusClass = "critical";
    }
    
    // 1. Live Radar Display
    if (appRadarValue) appRadarValue.textContent = rsrp;
    const appRadarBadge = document.getElementById('app-radar-badge');
    if (appRadarBadge) {
      appRadarBadge.textContent = status;
      appRadarBadge.className = `radar-badge-status status-${statusClass}`;
    }
    
    // 2. Carrier & Cell PCI info
    const appCarrierVal = document.getElementById('app-carrier-val');
    if (appCarrierVal) appCarrierVal.textContent = carrier.toUpperCase();
    
    const appPciVal = document.getElementById('app-pci-val');
    if (appPciVal) appPciVal.textContent = pci;
    
    const gridPciVal = document.getElementById('grid-pci-val');
    if (gridPciVal) gridPciVal.textContent = pci;
    
    // 3. Grid RSRP Card Update
    if (gridRSRPValue) gridRSRPValue.textContent = `${rsrp} dBm`;
    if (gridRSRPFill) {
      const rsrpPct = Math.floor(((rsrp - (-120)) / (-65 - (-120))) * 100);
      gridRSRPFill.style.width = `${Math.min(100, Math.max(10, rsrpPct))}%`;
    }
    const gridRSRPStatus = document.getElementById('grid-rsrp-status');
    if (gridRSRPStatus) gridRSRPStatus.textContent = status;
    
    const rsrpCard = document.querySelector('.telemetry-grid-card:nth-child(1)');
    if (rsrpCard) {
      rsrpCard.className = `telemetry-grid-card border-${statusClass}`;
      const valueEl = rsrpCard.querySelector('.c-value');
      if (valueEl) {
        valueEl.className = `c-value text-${statusClass}`;
        valueEl.textContent = `${rsrp} dBm`;
      }
      const statusEl = rsrpCard.querySelector('.c-status');
      if (statusEl) {
        statusEl.className = `c-status text-${statusClass}`;
        statusEl.textContent = status;
      }
      const fillEl = rsrpCard.querySelector('.c-progress-fill');
      if (fillEl) {
        fillEl.className = `c-progress-fill bg-${statusClass}`;
      }
      const iconEl = rsrpCard.querySelector('.c-icon');
      if (iconEl) iconEl.className = `c-icon text-${statusClass}`;
    }
    
    // 4. Grid RSRQ Card Update
    if (gridRSRQValue) gridRSRQValue.textContent = `${rsrq} dB`;
    if (gridRSRQFill) {
      const rsrqPct = Math.floor(((rsrq - (-20)) / (-3 - (-20))) * 100);
      gridRSRQFill.style.width = `${Math.min(100, Math.max(10, rsrqPct))}%`;
    }
    
    let rsrqStatus = "OPTIMAL";
    let rsrqClass = "optimal";
    if (rsrq >= -10) {
      rsrqStatus = "OPTIMAL";
      rsrqClass = "optimal";
    } else if (rsrq >= -14) {
      rsrqStatus = "GOOD";
      rsrqClass = "optimal";
    } else if (rsrq >= -17) {
      rsrqStatus = "LOW QUALITY";
      rsrqClass = "low";
    } else {
      rsrqStatus = "CRITICAL";
      rsrqClass = "critical";
    }
    
    const gridRSRQStatus = document.getElementById('grid-rsrq-status');
    if (gridRSRQStatus) gridRSRQStatus.textContent = rsrqStatus;
    
    const rsrqCard = document.querySelector('.telemetry-grid-card:nth-child(2)');
    if (rsrqCard) {
      rsrqCard.className = `telemetry-grid-card border-${rsrqClass}`;
      const valueEl = rsrqCard.querySelector('.c-value');
      if (valueEl) {
        valueEl.className = `c-value text-${rsrqClass}`;
        valueEl.textContent = `${rsrq} dB`;
      }
      const statusEl = rsrqCard.querySelector('.c-status');
      if (statusEl) {
        statusEl.className = `c-status text-${rsrqClass}`;
        statusEl.textContent = rsrqStatus;
      }
      const fillEl = rsrqCard.querySelector('.c-progress-fill');
      if (fillEl) {
        fillEl.className = `c-progress-fill bg-${rsrqClass}`;
      }
      const iconEl = rsrqCard.querySelector('.c-icon');
      if (iconEl) iconEl.className = `c-icon text-${rsrqClass}`;
    }
    
    // 5. Grid SINR Card Update
    if (gridSINRValue) gridSINRValue.textContent = `${sinr} dB`;
    if (gridSINRFill) {
      const sinrPct = Math.floor(((sinr - 0) / (30 - 0)) * 100);
      gridSINRFill.style.width = `${Math.min(100, Math.max(10, sinrPct))}%`;
    }
    
    let sinrStatus = "OPTIMAL";
    let sinrClass = "optimal";
    if (sinr >= 20) {
      sinrStatus = "OPTIMAL";
      sinrClass = "optimal";
    } else if (sinr >= 12) {
      sinrStatus = "GOOD";
      sinrClass = "optimal";
    } else if (sinr >= 5) {
      sinrStatus = "LOW QUALITY";
      sinrClass = "low";
    } else {
      sinrStatus = "CRITICAL";
      sinrClass = "critical";
    }
    
    const gridSINRStatus = document.getElementById('grid-sinr-status');
    if (gridSINRStatus) gridSINRStatus.textContent = sinrStatus;
    
    const sinrCard = document.querySelector('.telemetry-grid-card:nth-child(3)');
    if (sinrCard) {
      sinrCard.className = `telemetry-grid-card border-${sinrClass}`;
      const valueEl = sinrCard.querySelector('.c-value');
      if (valueEl) {
        valueEl.className = `c-value text-${sinrClass}`;
        valueEl.textContent = `${sinr} dB`;
      }
      const statusEl = sinrCard.querySelector('.c-status');
      if (statusEl) {
        statusEl.className = `c-status text-${sinrClass}`;
        statusEl.textContent = sinrStatus;
      }
      const fillEl = sinrCard.querySelector('.c-progress-fill');
      if (fillEl) {
        fillEl.className = `c-progress-fill bg-${sinrClass}`;
      }
      const iconEl = sinrCard.querySelector('.c-icon');
      if (iconEl) iconEl.className = `c-icon text-${sinrClass}`;
    }
  }


  // --- Interactive Telemetry Slider Simulator ---
  const signalSlider = document.getElementById('signal-slider');
  const signalBadge = document.getElementById('signal-badge');
  const signalDesc = document.getElementById('signal-description');
  const telemetryCarrier = document.getElementById('telemetry-carrier');
  
  const valRSRP = document.getElementById('rsrp-val');
  const valRSRQ = document.getElementById('rsrq-val');
  const valSINR = document.getElementById('sinr-val');
  
  const fillRSRP = document.getElementById('rsrp-fill');
  const fillRSRQ = document.getElementById('rsrq-fill');
  const fillSINR = document.getElementById('sinr-fill');
  
  const consoleStream = document.getElementById('console-stream');
  
  function addConsoleLine(msg) {
    if (!consoleStream) return;
    const timeStr = new Date().toLocaleTimeString();
    const line = document.createElement('div');
    line.className = 'console-line';
    line.textContent = `[${timeStr}] ${msg}`;
    consoleStream.appendChild(line);
    consoleStream.scrollTop = consoleStream.scrollHeight;
    
    while (consoleStream.children.length > 5) {
      consoleStream.removeChild(consoleStream.firstChild);
    }
  }

  const carriers = ["Jio 4G", "Airtel 4G", "Vodafone Idea"];
  let carrierIndex = 0;
  
  setInterval(() => {
    if (telemetryCarrier) {
      carrierIndex = (carrierIndex + 1) % carriers.length;
      telemetryCarrier.textContent = carriers[carrierIndex];
      addConsoleLine(`Network Status: Serving Cell Registered on ${carriers[carrierIndex]}`);
    }
  }, 10000);

  if (signalSlider) {
    signalSlider.addEventListener('input', (e) => {
      const score = parseInt(e.target.value);
      
      let rsrp, rsrq, sinr, quality, descText, badgeClass;
      
      if (score < 30) {
        rsrp = Math.round(-118 + (score / 30) * 10);
        rsrq = Math.round(-19 + (score / 30) * 4);
        sinr = Math.round(-4 + (score / 30) * 6);
        quality = "CRITICAL";
        badgeClass = "poor";
        descText = "Critical signal levels. Severe packet loss and coverage dropouts are expected.";
      } else if (score < 55) {
        const rel = (score - 30) / 25;
        rsrp = Math.round(-108 + rel * 13);
        rsrq = Math.round(-15 + rel * 4);
        sinr = Math.round(2 + rel * 7);
        quality = "LOW QUALITY";
        badgeClass = "poor"; 
        descText = "Low quality network signals. Core data actions working, logging active.";
      } else if (score < 80) {
        const rel = (score - 55) / 25;
        rsrp = Math.round(-95 + rel * 15);
        rsrq = Math.round(-11 + rel * 3);
        sinr = Math.round(9 + rel * 8);
        quality = "GOOD";
        badgeClass = "fair";
        descText = "Good signal strength. Stable connectivity, ready for routine operations.";
      } else {
        const rel = (score - 80) / 20;
        rsrp = Math.round(-80 + rel * 15);
        rsrq = Math.round(-8 + rel * 5);
        sinr = Math.round(17 + rel * 13);
        quality = "OPTIMAL";
        badgeClass = "";
        descText = "Optimal network signal, lowest interference index, maximum link capacity.";
      }
      
      // Update DOM
      signalBadge.textContent = quality;
      signalBadge.className = `summary-badge ${badgeClass}`;
      signalDesc.textContent = descText;
      
      valRSRP.textContent = `${rsrp} dBm`;
      valRSRQ.textContent = `${rsrq} dB`;
      valSINR.textContent = `${sinr} dB`;
      
      const rsrpPct = Math.min(100, Math.max(0, ((rsrp - (-125)) / ( -60 - (-125))) * 100));
      const rsrqPct = Math.min(100, Math.max(0, ((rsrq - (-20)) / ( -3 - (-20))) * 100));
      const sinrPct = Math.min(100, Math.max(0, ((sinr - (-5)) / (32 - (-5))) * 100));
      
      fillRSRP.style.width = `${rsrpPct}%`;
      fillRSRQ.style.width = `${rsrqPct}%`;
      fillSINR.style.width = `${sinrPct}%`;
      
      fillRSRP.className = `meter-bar-fill ${quality === 'CRITICAL' || quality === 'LOW QUALITY' ? 'bg-critical' : quality === 'GOOD' ? 'bg-yellow' : 'bg-cyan'}`;
      fillRSRQ.className = `meter-bar-fill ${quality === 'CRITICAL' || quality === 'LOW QUALITY' ? 'bg-critical' : quality === 'GOOD' ? 'bg-yellow' : 'bg-optimal'}`;
      fillSINR.className = `meter-bar-fill ${quality === 'CRITICAL' || quality === 'LOW QUALITY' ? 'bg-critical' : quality === 'GOOD' ? 'bg-yellow' : 'bg-low'}`;
      
      if (Math.random() > 0.75) {
        addConsoleLine(`Hardware telemetry: PCI=219 RSRP=${rsrp}dBm SINR=${sinr}dB`);
      }
    });
  }


  // --- Speed Test Benchmark Engine ---
  const btnSpeedtest = document.getElementById('btn-start-speedtest');
  const speedNumber = document.getElementById('speed-number');
  const gaugeFill = document.getElementById('speed-gauge-fill');
  
  const speedDownload = document.getElementById('speed-download');
  const speedUpload = document.getElementById('speed-upload');
  const speedPing = document.getElementById('speed-ping');
  const speedJitter = document.getElementById('speed-jitter');
  
  const maxDashOffset = 534;
  
  function updateSpeedometer(mbps, maxSpeed = 100) {
    if (!speedNumber || !gaugeFill) return;
    speedNumber.textContent = mbps.toFixed(1);
    
    const fraction = Math.min(1.0, mbps / maxSpeed);
    const activeLength = 400; 
    const offset = maxDashOffset - (fraction * activeLength);
    gaugeFill.style.strokeDashoffset = offset;
  }
  
  if (btnSpeedtest) {
    btnSpeedtest.addEventListener('click', async () => {
      btnSpeedtest.disabled = true;
      btnSpeedtest.textContent = "Connecting...";
      
      speedDownload.textContent = "- -";
      speedUpload.textContent = "- -";
      speedPing.textContent = "- -";
      speedJitter.textContent = "- -";
      
      addConsoleLine("Speedtest: Initiating network socket connection...");
      
      try {
        // PHASE 1: Ping / Jitter (HEAD requests to origin)
        btnSpeedtest.textContent = "Testing Ping...";
        const pings = [];
        const pingUrl = window.location.origin + window.location.pathname;
        
        for (let i = 0; i < 4; i++) {
          const tStart = performance.now();
          await fetch(`${pingUrl}?cb=${Date.now()}-${i}`, { method: 'HEAD', cache: 'no-store' }).catch(() => {});
          const tEnd = performance.now();
          pings.push(tEnd - tStart);
          await new Promise(r => setTimeout(r, 150));
        }
        
        const avgPing = pings.reduce((a, b) => a + b, 0) / pings.length;
        let jitterSum = 0;
        for (let i = 1; i < pings.length; i++) {
          jitterSum += Math.abs(pings[i] - pings[i-1]);
        }
        const avgJitter = jitterSum / (pings.length - 1);
        
        speedPing.textContent = `${avgPing.toFixed(0)} ms`;
        speedJitter.textContent = `${avgJitter.toFixed(0)} ms`;
        addConsoleLine(`Speedtest: Latency completed. Ping=${avgPing.toFixed(1)}ms Jitter=${avgJitter.toFixed(1)}ms`);
        
        // PHASE 2: Download Speed (Real Fetch Stream from jsDelivr)
        btnSpeedtest.textContent = "Testing Download...";
        addConsoleLine("Speedtest: Running download stream (jsDelivr CDN)...");
        
        const dlUrl = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.js";
        let totalBytes = 0;
        const dlStart = performance.now();
        const dlDuration = 2500; // Run for at least 2.5s
        
        while (performance.now() - dlStart < dlDuration) {
          const runUrl = `${dlUrl}?cb=${Date.now()}-${Math.random()}`;
          const response = await fetch(runUrl, { cache: 'no-store' });
          if (!response.ok) throw new Error("Download server error");
          
          const reader = response.body.getReader();
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            totalBytes += value.length;
            const elapsed = (performance.now() - dlStart) / 1000;
            const currentSpeedMbps = (totalBytes * 8) / (elapsed * 1000000);
            updateSpeedometer(currentSpeedMbps, 100);
            
            // Safety escape if taking too long
            if (elapsed > 6.0) {
              await reader.cancel();
              break;
            }
          }
        }
        
        const dlElapsed = (performance.now() - dlStart) / 1000;
        const finalDlSpeed = (totalBytes * 8) / (dlElapsed * 1000000);
        speedDownload.textContent = `${finalDlSpeed.toFixed(1)} Mbps`;
        addConsoleLine(`Speedtest: Download completed: ${finalDlSpeed.toFixed(1)} Mbps`);
        
        // PHASE 3: Upload Speed (POST upload with local simulation checks)
        await new Promise(r => setTimeout(r, 600));
        btnSpeedtest.textContent = "Testing Upload...";
        addConsoleLine("Speedtest: Running upload stream...");
        
        const payloadSize = 2 * 1024 * 1024; // 2MB Upload payload
        const payload = new Uint8Array(payloadSize);
        for (let i = 0; i < payloadSize; i++) {
          payload[i] = Math.floor(Math.random() * 256);
        }
        
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const upStart = performance.now();
        
        const uploadSpeed = await new Promise((resolve) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", `${window.location.pathname}?cb=${Date.now()}`, true);
          
          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const elapsed = (performance.now() - upStart) / 1000;
              if (elapsed > 0) {
                let speedMbps = (event.loaded * 8) / (elapsed * 1000000);
                if (isLocal && speedMbps > 500) {
                  const targetSimSpeed = finalDlSpeed * 0.35 + (Math.random() - 0.5) * 2;
                  speedMbps = targetSimSpeed;
                }
                updateSpeedometer(speedMbps, 50);
              }
            }
          };
          
          xhr.onload = xhr.onerror = xhr.onabort = () => {
            const elapsed = (performance.now() - upStart) / 1000;
            let speedMbps = (payloadSize * 8) / (elapsed * 1000000);
            if (isLocal && speedMbps > 500) {
              speedMbps = finalDlSpeed * 0.35 + (Math.random() - 0.5) * 1.5;
            }
            if (speedMbps < 0.5) speedMbps = 0.5;
            resolve(speedMbps);
          };
          
          setTimeout(() => {
            xhr.abort();
          }, 6000);
          
          xhr.send(payload);
        });
        
        speedUpload.textContent = `${uploadSpeed.toFixed(1)} Mbps`;
        addConsoleLine(`Speedtest: Upload completed: ${uploadSpeed.toFixed(1)} Mbps`);
        
        // Final Clean up
        setTimeout(() => {
          updateSpeedometer(0);
          btnSpeedtest.disabled = false;
          btnSpeedtest.textContent = "Run Benchmark";
          addConsoleLine("Speedtest: Session completed and logged on-device.");
        }, 1000);
        
      } catch (err) {
        addConsoleLine(`Speedtest Error: ${err.message || err}`);
        btnSpeedtest.disabled = false;
        btnSpeedtest.textContent = "Run Benchmark";
        updateSpeedometer(0);
      }
    });
  }


  // --- Interactive Map Points, Tooltip & Telemetry Sync ---
  const mapPoints = document.querySelectorAll('.map-point');
  const mapTooltip = document.getElementById('map-tooltip');
  let isVehiclePaused = false;
  
  mapPoints.forEach(point => {
    point.addEventListener('mouseenter', (e) => {
      isVehiclePaused = true;
      const rsrpStr = point.getAttribute('data-rsrp') || '-101 dBm';
      const coord = point.getAttribute('data-coord') || '40.714, -74.004';
      
      if (mapTooltip) {
        mapTooltip.innerHTML = `
          <div class="tooltip-title">Telemetry Node</div>
          <div class="tooltip-body">
            <strong>RSRP:</strong> ${rsrpStr}<br>
            <strong>GPS:</strong> ${coord}
          </div>
        `;
        mapTooltip.classList.add('active');
      }
      
      // Update phone dashboard to match hovered point
      const rsrpVal = parseInt(rsrpStr) || -101;
      const cx = parseFloat(point.getAttribute('cx')) || 0;
      const pci = cx < 200 ? 219 : 408;
      const carrier = pci === 219 ? "Jio 4G" : "Airtel 4G";
      
      let rsrqVal = -11;
      let sinrVal = 8;
      if (rsrpVal >= -85) {
        rsrqVal = -7;
        sinrVal = 25;
      } else if (rsrpVal >= -98) {
        rsrqVal = -11;
        sinrVal = 14;
      } else if (rsrpVal >= -108) {
        rsrqVal = -15;
        sinrVal = 6;
      } else {
        rsrqVal = -18;
        sinrVal = 2;
      }
      
      updateTelemetryDashboard(rsrpVal, rsrqVal, sinrVal, carrier, pci);
    });
    
    point.addEventListener('mouseleave', () => {
      isVehiclePaused = false;
      if (mapTooltip) {
        mapTooltip.classList.remove('active');
      }
    });
  });


  // --- Map tabs navigation ---
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');
  
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    });
  });


  // --- Clipboard copy utility with Premium Success Animation ---
  const btnCopyCsv = document.getElementById('btn-copy-csv');
  const csvCodeBlock = document.getElementById('csv-code-block');
  
  if (btnCopyCsv && csvCodeBlock) {
    btnCopyCsv.addEventListener('click', () => {
      const codeText = csvCodeBlock.textContent;
      navigator.clipboard.writeText(codeText).then(() => {
        btnCopyCsv.textContent = "✓ Copied!";
        btnCopyCsv.classList.add('copied');
        
        setTimeout(() => {
          btnCopyCsv.textContent = "Copy Header";
          btnCopyCsv.classList.remove('copied');
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
    });
  }


  // --- Card Spotlight Hover Glow (Vercel/Supabase style) ---
  const featureCards = document.querySelectorAll('.feature-card');
  if (featureCards.length > 0 && !isReducedMotion) {
    featureCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }


  // --- Scroll-Driven Reveal Transitions (Intersection Observer) ---
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length > 0 && !isReducedMotion) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          revealObserver.unobserve(entry.target); // Trigger once
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });
    revealElements.forEach(el => revealObserver.observe(el));
  } else if (isReducedMotion) {
    // If user prefers reduced motion, show them immediately
    revealElements.forEach(el => el.classList.add('active'));
  }


  // --- Animated Realtime Mobility Test Vehicle & Telemetry Synchronization ---
  const drivePath = document.getElementById('map-drive-path');
  const driveVehicle = document.getElementById('drive-vehicle');
  
  if (drivePath && driveVehicle && !isReducedMotion) {
    const pathLength = drivePath.getTotalLength();
    let vehicleProgress = 0;
    const speed = 0.55; // Pixels per frame
    
    // Set initial position
    const startPt = drivePath.getPointAtLength(0);
    driveVehicle.setAttribute('cx', startPt.x);
    driveVehicle.setAttribute('cy', startPt.y);
    
    // Track previous handover side
    let lastHandoverSide = 'left'; // left is Jio, right is Airtel
    
    function animateVehicle() {
      if (!isVehiclePaused) {
        vehicleProgress += speed;
        if (vehicleProgress > pathLength) {
          vehicleProgress = 0;
        }
        
        const pt = drivePath.getPointAtLength(vehicleProgress);
        driveVehicle.setAttribute('cx', pt.x);
        driveVehicle.setAttribute('cy', pt.y);
        
        // Calculate distance from Cell Tower coordinates (190, 40)
        const dx = pt.x - 190;
        const dy = pt.y - 40;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Map distance to signal metrics
        // Peak signal is closest to tower (dist ~ 70-100px) -> RSRP ~ -74 dBm
        // Weakest signal is far (dist ~ 200px+) -> RSRP ~ -116 dBm
        const rsrp = Math.min(-68, Math.max(-118, Math.round(-65 - (dist - 65) * 0.4)));
        const rsrq = Math.min(-6, Math.max(-19, Math.round(-5 - (dist - 65) * 0.1)));
        const sinr = Math.min(30, Math.max(1, Math.round(28 - (dist - 65) * 0.2)));
        
        // Determine Carrier & Cell PCI info based on coordinate boundary (x = 200)
        let carrier = "Jio 4G";
        let pci = 219;
        let currentHandoverSide = 'left';
        
        if (pt.x >= 200) {
          carrier = "Airtel 4G";
          pci = 408;
          currentHandoverSide = 'right';
        }
        
        // Trigger console lines on carrier boundary transitions
        if (currentHandoverSide !== lastHandoverSide) {
          if (currentHandoverSide === 'right') {
            addConsoleLine(`Handover initiated: Jio 4G (PCI 219) ➔ Airtel 4G (PCI 408)`);
          } else {
            addConsoleLine(`Handover initiated: Airtel 4G (PCI 408) ➔ Jio 4G (PCI 219)`);
          }
          lastHandoverSide = currentHandoverSide;
        }
        
        // Periodically log location/telemetry details to console block
        if (Math.floor(vehicleProgress) % 90 === 0) {
          addConsoleLine(`GPS updated. PCI=${pci} RSRP=${rsrp}dBm SINR=${sinr}dB`);
        }
        
        // Update the 3D Phone Screen
        updateTelemetryDashboard(rsrp, rsrq, sinr, carrier, pci);
      }
      
      requestAnimationFrame(animateVehicle);
    }
    
    // Start vehicle loop
    requestAnimationFrame(animateVehicle);
  } else if (isReducedMotion) {
    // Static fallback: set mock dashboard to a good coverage state
    updateTelemetryDashboard(-80, -9, 21, "Jio 4G", 219);
  }

  // --- Back to Top Scroll Behavior ---
  const backToTopBtn = document.getElementById('back-to-top');
  if (backToTopBtn) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        backToTopBtn.classList.add('visible');
      } else {
        backToTopBtn.classList.remove('visible');
      }
    }, { passive: true });
    
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // --- Dynamic Spotlight, Border Glow, 3D Tilt & Ripple Click (MagicBento Integration) ---
  const interactiveCards = document.querySelectorAll(
    '.feature-card, .requirements-card, .dev-card, .privacy-card, .download-card, .supabase-sync-card'
  );
  
  // Cache card rects to prevent layout thrashing on global mousemove
  let cardRects = [];
  function updateCardRects() {
    cardRects = Array.from(interactiveCards).map(card => ({
      element: card,
      rect: card.getBoundingClientRect()
    }));
  }
  
  // Initial calculation
  updateCardRects();
  
  // Update cache on scroll or resize
  window.addEventListener('resize', updateCardRects, { passive: true });
  window.addEventListener('scroll', updateCardRects, { passive: true });
  
  // Listen to coordinates globally for smooth border highlights across card boundaries
  window.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    
    for (let i = 0; i < cardRects.length; i++) {
      const item = cardRects[i];
      const x = mouseX - item.rect.left;
      const y = mouseY - item.rect.top;
      item.element.style.setProperty('--mouse-x', `${x}px`);
      item.element.style.setProperty('--mouse-y', `${y}px`);
    }
  }, { passive: true });

  interactiveCards.forEach(card => {
    // Ensure relative positioning context and transform transitions
    card.style.position = 'relative';
    card.style.overflow = 'hidden';
    card.style.transition = 'transform 0.15s cubic-bezier(0.25, 0.8, 0.25, 1), border-color 0.3s ease, box-shadow 0.3s ease';
    
    // Create spotlight overlay
    const spotlight = document.createElement('div');
    spotlight.className = 'spotlight-overlay';
    
    // Create border glow overlay
    const borderGlow = document.createElement('div');
    borderGlow.className = 'border-glow';
    
    // Append to card DOM
    card.appendChild(spotlight);
    card.appendChild(borderGlow);
    
    // Apply 3D perspective tilt on local mousemove
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -5;
      const rotateY = ((x - centerX) / centerX) * 5;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    
    // Reset transform on mouseleave
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
    });
    
    // Create ripple effect on click
    card.addEventListener('click', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const ripple = document.createElement('span');
      ripple.className = 'card-ripple';
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      
      card.appendChild(ripple);
      setTimeout(() => {
        ripple.remove();
      }, 800);
    });
  });
});
