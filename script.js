// Referencias a los elementos del DOM
const paperContent = document.getElementById('paper-content');
const paperContainer = document.getElementById('paper-container');
const cursor = document.getElementById('cursor');

// Paletas de color y fuentes para el modo Recortes de Revista
const backgrounds = ['#1a1a1a', '#c9182b', '#e09f3e', '#005f73', '#0a9396', '#ca6702', '#bb3e03', '#ffffff', '#588157'];
const textColors  = ['#ffffff', '#ffffff', '#000000', '#ffffff', '#ffffff', '#ffffff', '#ffffff', '#000000', '#ffffff'];
const fonts       = ['\'Special Elite\', cursive', '\'Courier Prime\', monospace', '\'Abril Fatface\', serif', '\'Cinzel\', serif', 'sans-serif'];

// Contexto de Audio Web (sintetiza el sonido sin requerir archivos mp3 externos)
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

/**
 * Genera sonidos mecánicos usando Web Audio API
 * @param {string} type - 'key', 'space', 'enter', o 'bell'
 */
function playSound(type = 'key') {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;

  // Campana al final de la línea
  if (type === 'bell') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.8);
    return;
  }

  // Sonido metálico para la tecla ENTER
  if (type === 'enter') {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.12);
    return;
  }

  // Ruido blanco filtrado para el golpe de las teclas y la barra espaciadora
  const bufferSize = audioCtx.sampleRate * (type === 'space' ? 0.05 : 0.035); 
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1; 
  }

  const noise = audioCtx.createBufferSource();
  noise.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = type === 'space' ? 400 : (600 + Math.random() * 400); 

  const gainNode = audioCtx.createGain();
  const volume = type === 'space' ? 0.25 : 0.4;
  gainNode.gain.setValueAtTime(volume, now);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + (type === 'space' ? 0.045 : 0.03));

  noise.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  noise.start(now);
}

/**
 * Procesa la pulsación de cada tecla
 * @param {string} key - Valor del carácter o acción
 */
function handleInput(key) {
  const mode = document.querySelector('input[name="writeMode"]:checked').value;

  if (key === 'Backspace') {
    playSound('key');
    removeLastChar();
  } else if (key === 'Enter') {
    playSound('enter');
    addBreak();
  } else if (key === ' ') {
    playSound('space');
    addSpace();
  } else if (key.length >= 1) {
    playSound('key');
    if (mode === 'typewriter') {
      addTypewriterLetter(key);
    } else {
      addCutoutLetter(key);
    }
  }

  // Suena la campanilla al acercarse al límite aproximado de ancho
  const currentText = paperContent.innerText;
  const lastLine = currentText.split('\n').pop();
  if (lastLine && lastLine.length === 55 && key !== 'Backspace') {
    playSound('bell');
  }

  // Auto-scroll al final de la hoja
  paperContainer.scrollTop = paperContainer.scrollHeight;
}

// Agrega letra con imperfecciones de tinta y alineación
function addTypewriterLetter(char) {
  const span = document.createElement('span');
  span.className = 'char-typewriter';
  span.textContent = char;

  const randomOffsetY = (Math.random() * 1.5 - 0.75).toFixed(1);
  const randomRotate = (Math.random() * 2 - 1).toFixed(1);
  const randomOpacity = (0.85 + Math.random() * 0.15).toFixed(2);

  span.style.transform = `translateY(${randomOffsetY}px) rotate(${randomRotate}deg)`;
  span.style.opacity = randomOpacity;

  paperContent.appendChild(span);
  triggerPaperShift();
}

// Agrega letra con estilo recortes de papel/revista
function addCutoutLetter(char) {
  const span = document.createElement('span');
  span.className = 'cutout';
  span.textContent = char;

  const randomIndex = Math.floor(Math.random() * backgrounds.length);
  const randomFont = fonts[Math.floor(Math.random() * fonts.length)];
  const randomRotation = (Math.random() * 10 - 5).toFixed(1); 
  const randomScale = (0.92 + Math.random() * 0.15).toFixed(2);

  span.style.backgroundColor = backgrounds[randomIndex];
  span.style.color = textColors[randomIndex];
  span.style.fontFamily = randomFont;
  span.style.transform = `rotate(${randomRotation}deg) scale(${randomScale})`;

  paperContent.appendChild(span);
  triggerPaperShift();
}

function addSpace() {
  const space = document.createTextNode(' ');
  paperContent.appendChild(space);
  triggerPaperShift();
}

function addBreak() {
  const br = document.createElement('br');
  paperContent.appendChild(br);
}

function removeLastChar() {
  if (paperContent.lastChild) {
    paperContent.removeChild(paperContent.lastChild);
  }
}

function clearPaper() {
  paperContent.innerHTML = '';
}

// Micro-vibración visual en la hoja al golpear el martillo de la tecla
function triggerPaperShift() {
  paperContainer.style.transform = 'translateY(-1px)';
  setTimeout(() => {
    paperContainer.style.transform = 'translateY(0)';
  }, 50);
}

// Evento para teclado físico del teléfono o PC
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.altKey || e.metaKey) return;

  let targetKey = e.key;

  if (e.key === 'Backspace' || e.key === 'Enter' || e.key === ' ') {
    targetKey = e.key;
  } else if (e.key.length === 1) {
    targetKey = e.key.toUpperCase();
  } else {
    return;
  }

  // Resalta la tecla física presionada
  const keyElement = document.querySelector(`.key[data-key="${CSS.escape(targetKey)}"]`);
  if (keyElement) {
    keyElement.classList.add('pressed');
    setTimeout(() => keyElement.classList.remove('pressed'), 100);
  }

  handleInput(targetKey);
});

// Evento para clics o toques táctiles en el teclado vintage en pantalla
document.getElementById('keyboard').addEventListener('click', (e) => {
  const keyBtn = e.target.closest('.key');
  if (keyBtn) {
    const keyValue = keyBtn.getAttribute('data-key');
    handleInput(keyValue);
  }
});

// Genera y descarga la carta como imagen PNG
function downloadLetter() {
  cursor.style.display = 'none';

  html2canvas(paperContainer, {
    scale: 3,
    backgroundColor: '#f3ebd3'
  }).then(canvas => {
    const link = document.createElement('a');
    link.download = 'carta-vintage.png';
    link.href = canvas.toDataURL('image/png');
    link.click();

    cursor.style.display = 'inline-block';
  });
    }
