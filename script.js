/* ========== Utilities ========== */
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const safeJSON = v => { try { return JSON.parse(v); } catch(e){return null} };

/* ========== Simple smooth scroll for nav links ========== */
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener('click', e=>{
    e.preventDefault();
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if(el) el.scrollIntoView({behavior:'smooth', block: 'start'});
  });
});

/* ========== Simulated carrito states (persisted) ========== */
const defaultStates = {barrios: 'Disponible', centro: 'Disponible'};
function loadStates(){
  const s = safeJSON(localStorage.getItem('carrito_states')) || defaultStates;
  return s;
}
function saveStates(states){ localStorage.setItem('carrito_states', JSON.stringify(states)); }
function applyStates(){
  const s = loadStates();
  $('#estado-barrios').textContent = s.barrios;
  $('#estado-centro').textContent = s.centro;
const barrios = $('#estado-barrios');
const centro = $('#estado-centro');

barrios.classList.remove('estado-disponible','estado-no-disponible');
barrios.classList.add(s.barrios === 'Disponible' ? 'estado-disponible' : 'estado-no-disponible');

centro.classList.remove('estado-disponible','estado-no-disponible');
centro.classList.add(s.centro === 'Disponible' ? 'estado-disponible' : 'estado-no-disponible');
}
function toggleEstado(car){
  const s = loadStates();
  s[car] = s[car] === 'Disponible' ? 'Agotado' : 'Disponible';
  saveStates(s);
  applyStates();
}
window.toggleEstado = toggleEstado; // expose for inline buttons
applyStates();



/* ========== centrarCarrito -> simplemente baja a la sección del mapa y muestra mensaje ====== */
function centrarCarrito(car){
  // Si mañana conectas un mapa interactivo puedes centrar lat/lng aquí
  document.getElementById('mapa').scrollIntoView({behavior:'smooth', block: 'center'});
  // show temporary bot-like toast inside map area
  const msg = document.createElement('div');
  msg.className = 'bot-message';
  msg.textContent = car === 'barrios' ? 'Centro en Carrito Barrios (simulado)' : 'Centro en Carrito Centro (simulado)';
  document.querySelector('#mapa .map-wrapper').prepend(msg);
  setTimeout(()=> msg.remove(), 3500);
}
window.centrarCarrito = centrarCarrito;

/* ========== RATINGS (estrellas) ========== */
const stars = document.querySelectorAll("#rating-container .star");
const ratingResult = document.getElementById("rating-result");

stars.forEach((star, index) => {
    // Hover visual
    star.addEventListener("mouseover", () => {
        stars.forEach((s, i) => {
            s.style.color = i <= index ? "#ffcc00" : "#ccc";
        });
    });

    star.addEventListener("mouseout", () => {
        stars.forEach((s, i) => {
            s.style.color = s.classList.contains("selected") ? "#ffcc00" : "#ccc";
        });
    });

    // Click para seleccionar
    star.addEventListener("click", () => {
        stars.forEach((s, i) => {
            if (i <= index) {
                s.classList.add("selected");
            } else {
                s.classList.remove("selected");
            }
        });
        ratingResult.textContent = `Has calificado con ${index + 1} estrella(s) ⭐`;
    });
});


/* ========== COMENTARIOS (localStorage) ========== */
const lista = $('#lista-comentarios');
const inputComentario = $('#comentario');
const inputNombre = $('#nombreComentario');
function loadComentarios(){ return safeJSON(localStorage.getItem('mazamorra_comments')) || []; }
function saveComentarios(arr){ localStorage.setItem('mazamorra_comments', JSON.stringify(arr)); }
function renderComentarios(){
  const arr = loadComentarios();
  lista.innerHTML = '';
  if(arr.length === 0){ lista.innerHTML = '<div class="comentario-item">No hay comentarios aún. Sé el primero.</div>'; return; }
  arr.slice().reverse().forEach(c=>{
    const div = document.createElement('div');
    div.className = 'comentario-item';
    div.innerHTML = `<strong>${c.nombre || 'Anónimo'}</strong> <small class="muted">· ${new Date(c.ts).toLocaleString()}</small><p>${c.text}</p>`;
    lista.appendChild(div);
  });
}
renderComentarios();

$('#enviarComentario').addEventListener('click', ()=>{
  const text = inputComentario.value.trim();
  if(!text){ alert('Escribe tu comentario antes de enviar.'); return; }
  const nombre = inputNombre.value.trim();
  const arr = loadComentarios();
  arr.push({nombre:nombre, text:text, ts: Date.now()});
  saveComentarios(arr);
  inputComentario.value = '';
  inputNombre.value = '';
  renderComentarios();
  // auto-scroll to comments
  document.getElementById('comentarios').scrollIntoView({behavior:'smooth'});
});
$('#borrarComentarios').addEventListener('click', ()=>{
  if(!confirm('¿Borrar todos los comentarios? (solo hazlo si quieres eliminar todo)')) return;
  localStorage.removeItem('mazamorra_comments');
  renderComentarios();
});

/* ========== CHATBOT (UI + simple respuestas) ========== */
const chatToggle = $('#chat-toggle');
const chatWindow = $('#chat-window');
const chatClose = $('#chat-close');
const chatBody = $('#chat-body');
const chatInput = $('#chat-input');
const chatSend = $('#chat-send');
const chatbotWrap = $('#chatbot');

function openChat(){ chatbotWrap.classList.remove('chatbot-closed'); chatInput.focus(); }
function closeChat(){ chatbotWrap.classList.add('chatbot-closed'); }
chatToggle.addEventListener('click', openChat);
chatClose.addEventListener('click', closeChat);

// menu buttons in chatbot
document.querySelectorAll('.chat-menu .menu-btn').forEach(btn=>{
  btn.addEventListener('click', ()=> {
    const action = btn.getAttribute('data-action');
    handleBotAction(action);
  });
});

chatSend.addEventListener('click', onSendChat);
chatInput.addEventListener('keydown', (e)=> { if(e.key === 'Enter') onSendChat(); });

function appendBot(msg){
  const d = document.createElement('div'); d.className = 'bot-message'; d.textContent = msg; chatBody.appendChild(d); chatBody.scrollTop = chatBody.scrollHeight;
}
function appendUser(msg){
  const d = document.createElement('div'); d.className = 'user-message'; d.textContent = msg; chatBody.appendChild(d); chatBody.scrollTop = chatBody.scrollHeight;
}

function onSendChat(){
  const text = chatInput.value.trim();
  if(!text) return;
  appendUser(text);
  chatInput.value = '';
  // quick intent heuristics
  setTimeout(()=> {
    const lower = text.toLowerCase();
    if(lower.includes('precio') || lower.includes('vaso') || lower.includes('cuchar')) {
      appendBot('Precios: Vaso (consultar en sección de Precios). Ollada: precio por cucharón. Visita la sección "Calificar" y "Comentarios" para más.');
      return;
    }
    if(lower.includes('donde') || lower.includes('cerca') || lower.includes('mapa')) {
      appendBot('Abre la sección "Mapa" para ver rutas y carritos. También puedo indicar cuál está más cerca si permites la ubicación.');
      return;
    }
    if(lower.includes('horario') || lower.includes('cuando')) {
      appendBot('Trabajamos miércoles a sábado desde las 9:00 a.m. hasta agotar existencias. Consulta detalles en "Horarios".');
      return;
    }
    if(lower.includes('historia') || lower.includes('origen')) {
      appendBot('Somos una familia de La Virginia dedicada a la mazamorra. Visita la sección "Historia" para leer más.');
      return;
    }
    // fallback
    appendBot('Lo siento, no tengo esa respuesta automática. Prueba usar el menú o escribe: "precios", "horario", "mapa", "hablar".');
  }, 450);
}

function handleBotAction(action){
  if(action === 'cercano'){
    // use geolocation if available
    if(navigator.geolocation){
      appendBot('Buscando carrito más cercano a tu ubicación…');
      navigator.geolocation.getCurrentPosition(pos=>{
        // simple simulated logic: if longitude (pos.coords.longitude) odd -> barrios else centro (just demo)
        const lon = pos.coords.longitude;
        const chosen = (Math.abs(Math.round(lon)) % 2 === 0) ? 'Carrito Barrios' : 'Carrito Centro';
        appendBot(`El carrito más cercano (simulado) es: ${chosen}.`);
      }, ()=> {
        appendBot('No pudimos obtener tu ubicación. Revisa permisos del navegador o selecciona manualmente en el mapa.');
      });
    } else {
      appendBot('Tu navegador no soporta geolocalización.');
    }
    return;
  }

  if(action === 'disponibilidad'){
    const s = loadStates();
    appendBot(`Estado actual — Barrios: ${s.barrios}. Centro: ${s.centro}.`);
    return;
  }

  if(action === 'precios'){
    appendBot('Precios:\n• Vaso: (Ej. $3.000) \n• Ollada: por cucharón (pregunta al vendedor o revisa la sección de precios).');
    return;
  }

  if(action === 'horarios'){
    appendBot('Trabajamos miércoles a sábado desde las 9:00 a.m. hasta que se acabe la mazamorra. Carrito Barrios suele acabar entre 1–3pm, Carrito Centro entre 2–4pm.');
    return;
  }

  if(action === 'rutas'){
    appendBot('Las rutas varían por día. Consulta la sección "Mapa" para las rutas actualizadas.');
    return;
  }

  if(action === 'mapa'){
    document.getElementById('mapa').scrollIntoView({behavior:'smooth'});
    appendBot('He abierto el mapa para ti.');
    return;
  }

  if(action === 'comentarios'){
    document.getElementById('comentarios').scrollIntoView({behavior:'smooth'});
    appendBot('Puedes dejar un comentario en la sección correspondiente.');
    return;
  }

  if(action === 'hablar'){
    // We do NOT auto-send to WhatsApp — show simulated options
    appendBot('Puedes elegir a cuál carrito deseas hablar (simulado). El contacto real se realiza desde el teléfono del vendedor.');
    appendBot('Opciones: 1) Carrito Barrios — 2) Carrito Centro. (Esto es una interfaz simulada).');
    return;
  }

  if(action === 'historia'){
    document.getElementById('historia').scrollIntoView({behavior:'smooth'});
    appendBot('Abriendo la sección Historia...');
    return;
  }

  if(action === 'noticias'){
    document.getElementById('noticias').scrollIntoView({behavior:'smooth'});
    appendBot('Abriendo Noticias...');
    return;
  }

  appendBot('Acción no reconocida.');
}

/* Init a small welcome message if user stays idle for a bit */
setTimeout(()=> appendBot('Si necesitas ayuda, usa el menú o escribe tu pregunta.'), 2000);

/* Apply initial UI states (chat closed by default) */
chatbotWrap.classList.add('chatbot-closed');

/* ========== extra: prevent errors if elements missing ========== */
window.addEventListener('error', e=> {
  // nothing fatal; keep console clean
  // console.warn('page error', e.message);
});







document.addEventListener("DOMContentLoaded", () => {

    // --- BASE DE CONOCIMIENTO (CLAVES + PALABRAS QUE DETECTA) ---
    const respuestas = {
        "cercano": {
            palabras: ["cerca", "cercano", "ubicado", "donde estan", "están cerca"],
            respuesta: "Buscando el carrito más cercano… (función GPS futura)."
        },
        "disponibilidad": {
            palabras: ["disponible", "disponibilidad", "hoy hay", "abierto", "abren"],
            respuesta: "Ambos carritos trabajan de miércoles a sábado desde las 9:00 am hasta que se acabe la mazamorra."
        },
        "precios": {
            palabras: ["precio", "vale", "cuesta", "cuánto", "plata"],
            respuesta: "El vaso vale $3.000 pesos. También vendemos por cucharones para ollas."
        },
        "horarios": {
            palabras: ["horario", "hora", "horarios"],
            respuesta: "Trabajamos de miércoles a sábado desde las 9:00 a.m. hasta que se acabe la mazamorra."
        },
        "rutas": {
            palabras: ["ruta", "rutas", "recorrido", "recorridos", "carritos"],
            respuesta: "Carrito Barrios: Brahian e Inés.\nCarrito Centro: Eliana y Tatiana."
        },
        "mapa": {
            palabras: ["mapa", "ubicacion", "ubicación", "ver mapa"],
            respuesta: "Puedes ver las rutas y ubicación aproximada en la sección MAPA."
        },
        "comentarios": {
            palabras: ["comentario", "comentarios", "opinion", "opinión"],
            respuesta: "Puedes dejar tu comentario abajo en la sección COMENTARIOS."
        },
        "hablar": {
            palabras: ["hablar", "contacto", "escribir"],
            respuesta: "Por ahora no tenemos conexión directa a WhatsApp. Función será añadida más adelante."
        },
        "historia": {
            palabras: ["historia", "quienes son", "qué son", "origen"],
            respuesta: "Somos La Original, una familia dedicada a llevar mazamorra fresca y pilada a todo el pueblo de La Virginia."
        },
        "noticias": {
            palabras: ["noticias", "novedades", "actualización"],
            respuesta: "Muy pronto tendremos promociones, nuevos recorridos y sorpresas especiales."
        }
    };

    // --- FUNCIÓN PARA AGREGAR BURBUJAS DE CHAT ---
    function agregarMensaje(texto, tipo) {
        const contenedor = document.getElementById("chat-mensajes");

        const mensaje = document.createElement("div");
        mensaje.classList.add("mensaje", tipo);
        mensaje.innerText = texto;

        contenedor.appendChild(mensaje);
        contenedor.scrollTop = contenedor.scrollHeight;
    }

    // --- PROCESAR MENSAJE DEL USUARIO ---
    function responder(mensajeUsuario) {
        const mensaje = mensajeUsuario.toLowerCase().trim();
        let respuestaFinal = "No entendí bien 🥺 ¿Puedes repetir tu pregunta?";

        // Buscar coincidencias por palabras clave
        for (let clave in respuestas) {
            const grupo = respuestas[clave];

            if (grupo.palabras.some(p => mensaje.includes(p))) {
                respuestaFinal = grupo.respuesta;
                break;
            }
        }

        setTimeout(() => agregarMensaje(respuestaFinal, "bot"), 600);
    }

    // --- ENVIAR MENSAJE POR BOTÓN ENVIAR ---
    document.getElementById("enviar-btn").addEventListener("click", () => {
        const input = document.getElementById("chat-input");
        const texto = input.value.trim();

        if (texto !== "") {
            agregarMensaje(texto, "usuario");
            responder(texto);
            input.value = "";
        }
    });

    // --- ENVIAR CON ENTER ---
    document.getElementById("chat-input").addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            document.getElementById("enviar-btn").click();
        }
    });

    // --- RESPUESTAS DESDE BOTONES DEL MENÚ (data-action) ---
    const botones = document.querySelectorAll(".menu-btn");

    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            const accion = boton.dataset.action;

            // Mostrar mensaje como si fuera del usuario
            agregarMensaje(boton.innerText, "usuario");

            // Buscar la respuesta dentro del objeto principal
            if (respuestas[accion]) {
                setTimeout(() => {
                    agregarMensaje(respuestas[accion].respuesta, "bot");
                }, 500);
            } else {
                setTimeout(() => {
                    agregarMensaje("No tengo información sobre eso aún 😅", "bot");
                }, 500);
            }
        });
    });

});








document.addEventListener("DOMContentLoaded", () => {
    const heroInner = document.querySelector(".hero-inner");
    const slider = document.querySelector(".hero-slider");
    const slides = slider.querySelectorAll(".slide");
    let currentSlide = 0;

    // Muestra un slide
    function mostrarSlide(index) {
        slides.forEach((slide, i) => {
            slide.style.display = i === index ? "block" : "none";
        });
    }

    // Cambiar al siguiente slide
    function nextSlide() {
        currentSlide = (currentSlide + 1) % slides.length;
        mostrarSlide(currentSlide);
    }

    // Después de 3 segundos, ocultar hero y mostrar slider
    setTimeout(() => {
        heroInner.style.display = "none"; // oculta hero inicial
        slider.style.display = "block"; // muestra slider
        mostrarSlide(currentSlide); // muestra primer slide
        setInterval(nextSlide, 4000); // cada 4 segundos
    }, 6000);
});














document.querySelectorAll('.marker').forEach(marker => {
    marker.addEventListener('click', () => {
        const id = marker.id;
        if (id === 'marker-barrios') alert('Carrito Barrios: Brahian & Inés\nEstado: ' + (loadStates().barrios));
        if (id === 'marker-centro') alert('Carrito Centro: Eliana & Tatiana\nEstado: ' + (loadStates().centro));
    });
});
