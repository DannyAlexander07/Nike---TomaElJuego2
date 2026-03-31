const firebaseConfig = {
    apiKey: "AIzaSyDOFl9_pb_TfXsePB26cJLW9hbGbnGbWc4",
    authDomain: "total90-2026.firebaseapp.com",
    projectId: "total90-2026",
    storageBucket: "total90-2026.firebasestorage.app",
    messagingSenderId: "419383010670",
    appId: "1:419383010670:web:c930e8edebf6ce72924d7f",
    measurementId: "G-DZ7BKWSP0B"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let equipos = []; 
let equiposFiltrados = [];
let paginaActual = 1;
const filasPorPagina = 5;

function cargarDatosDesdeFirebase() {
    db.collection("registros_torneo").orderBy("fechaRegistro", "desc")
    .onSnapshot((querySnapshot) => {
        equipos = [];
        querySnapshot.forEach((doc) => {
            equipos.push({ ...doc.data(), firestoreId: doc.id });
        });
        
        aplicarFiltros();
    }, (error) => {
        console.error("Error al obtener datos de Firebase: ", error);
    });
}

function renderizarTabla() {
    const tbody = document.getElementById('tbodyRegistros');
    if(!tbody) return;
    tbody.innerHTML = '';

    const inicio = (paginaActual - 1) * filasPorPagina;
    const fin = inicio + filasPorPagina;
    const paginados = equiposFiltrados.slice(inicio, fin);

    if(paginados.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;">No se encontraron registros.</td></tr>`;
    }

    paginados.forEach((equipo) => {
        const tr = document.createElement('tr');
        const displayId = equipo.id ? equipo.id.toString().slice(-6) : "---";
        
        tr.innerHTML = `
            <td>#${displayId}</td>
            <td><strong>${equipo.sede}</strong></td>
            <td>${equipo.categoria}</td>
            <td>${equipo.capitan.nombre}</td>
            <td>${equipo.capitan.dni}</td>
            <td>${equipo.capitan.whatsapp}</td>
            <td>
                <span class="estado-badge ${equipo.estado === 'Pendiente' ? 'pendiente' : 'registrado'}" 
                      onclick="cambiarEstado('${equipo.firestoreId}', '${equipo.estado}')">
                    ${equipo.estado}
                </span>
            </td>
            <td>
                <button class="btn-accion btn-ver" onclick="verDetalles('${equipo.firestoreId}')" title="Ver Detalles">Ver</button>
                <button class="btn-accion btn-eliminar" onclick="eliminarRegistro('${equipo.firestoreId}', '${equipo.capitan.nombre}')" title="Eliminar">🗑️</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    actualizarControlesPaginacion();
}

function aplicarFiltros() {
    const txtBuscar = document.getElementById('buscarTexto').value.toLowerCase();
    const valSede = document.getElementById('filtroSede').value;
    const valCat = document.getElementById('filtroCategoria').value;
    const valEst = document.getElementById('filtroEstado').value;

    equiposFiltrados = equipos.filter(e => {
        const nombreCapitan = e.capitan?.nombre?.toLowerCase() || "";
        const dniCapitan = e.capitan?.dni?.toString() || "";
        
        const matchBuscar = nombreCapitan.includes(txtBuscar) || dniCapitan.includes(txtBuscar);
        const matchSede = valSede === 'Todas' ? true : e.sede === valSede;
        const matchCat = valCat === 'Todas' ? true : e.categoria === valCat;
        const matchEst = valEst === 'Todos' ? true : e.estado === valEst;
        
        return matchBuscar && matchSede && matchCat && matchEst;
    });

    renderizarTabla();
}

document.getElementById('buscarTexto').addEventListener('input', () => { paginaActual = 1; aplicarFiltros(); });
document.getElementById('filtroSede').addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });
document.getElementById('filtroCategoria').addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });
document.getElementById('filtroEstado').addEventListener('change', () => { paginaActual = 1; aplicarFiltros(); });


const modal = document.getElementById('modalDetalle');
const btnCerrarArriba = document.getElementById('cerrarModal');
const btnCerrarAbajo = document.getElementById('btnCerrarAbajo');

function verDetalles(firestoreId) {
    const eq = equipos.find(e => e.firestoreId === firestoreId);
    if (!eq) return;

    // 1. Identificar jugadores registrados para validar el equipo completo
    const jugadoresParaValidar = [eq.capitan, eq.j2, eq.j3, eq.suplente].filter(j => j && j.nombre);
    
    // 2. Verificar si TODOS cumplen con el rango (2007-07-08 a 2011-03-12)
    const equipoEsApto = jugadoresParaValidar.every(j => {
        const info = calcularInfoEdad(j.nacimiento);
        return info ? info.apto : true;
    });

    const cuerpo = document.getElementById('modalCuerpo');

    // 3. Función interna para generar cada bloque de jugador
    const generarBloqueJugador = (titulo, datos, esCapitan = false) => {
        if (!datos || (!esCapitan && !datos.nombre)) {
            return `
                <div class="dato-item">
                    <h4>${titulo}</h4>
                    <p><em>No registrado</em></p>
                </div>`;
        }

        // Calculamos la info de edad basada en los límites del torneo
        const infoEdad = calcularInfoEdad(datos.nacimiento);

        return `
            <div class="dato-item" ${esCapitan ? 'style="border-top: 4px solid #000;"' : ''}>
                <h4>${titulo}</h4>
                <p><strong>Nombre:</strong> ${datos.nombre || 'N/A'}</p>
                <p><strong>DNI:</strong> ${datos.dni || 'N/A'}</p>
                <p><strong>Nacimiento:</strong> ${datos.nacimiento || 'N/A'} 
                    <span style="display:block; font-size:0.85rem; color:${infoEdad.color}; font-weight:bold; margin-top:4px;">
                        ${infoEdad.texto} ${infoEdad.apto ? '✅' : '❌'}
                    </span>
                </p>
                <p><strong>Email:</strong> ${datos.email || 'N/A'}</p>
                ${esCapitan ? `<p><strong>WhatsApp:</strong> ${datos.whatsapp || 'N/A'}</p>` : ''}
                ${esCapitan ? `<p><strong>Dirección:</strong> ${datos.direccion || 'N/A'}</p>` : ''}
                <p style="color: #e74c3c; font-weight: bold; margin-top: 5px;">
                    <strong>Emergencia:</strong> ${datos.emergencia || 'No proporcionado'}
                </p>
            </div>
        `;
    };

    // 4. Inyectar el HTML al cuerpo del modal
    cuerpo.innerHTML = `
        <div style="margin-bottom: 1.5rem; padding-bottom: 12px; border-bottom: 2px solid #f1f1f1; font-family: 'Helvetica', sans-serif;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <span style="background: #000; color: #fff; padding: 3px 10px; border-radius: 4px; font-weight: bold; margin-right: 10px;">
                        ID: ${eq.id ? eq.id.toString().slice(-6) : '---'}
                    </span>
                    <strong>Sede:</strong> ${eq.sede} | <strong>Cat:</strong> ${eq.categoria} | <strong>Estado:</strong> ${eq.estado}
                </div>
                <div style="background: ${equipoEsApto ? '#27ae60' : '#e74c3c'}; color: #fff; padding: 5px 15px; border-radius: 20px; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${equipoEsApto ? 'EQUIPO APTO ✅' : 'REVISAR EDADES ⚠️'}
                </div>
            </div>
        </div>
        
        <div class="grid-datos">
            ${generarBloqueJugador('Capitán', eq.capitan, true)}
            ${generarBloqueJugador('Jugador 2', eq.j2)}
            ${generarBloqueJugador('Jugador 3', eq.j3)}
            ${generarBloqueJugador('Jugador Suplente', eq.suplente)}
        </div>

        ${eq.fechaRegistro ? `
            <div style="margin-top: 1.5rem; font-size: 0.75rem; color: #aaa; text-align: right; font-style: italic;">
                Inscrito el: ${new Date(eq.fechaRegistro).toLocaleString()}
            </div>
        ` : ''}
    `;

    const modal = document.getElementById('modalDetalle');
    modal.style.display = 'flex';
}

const cerrarModalFunc = () => modal.style.display = 'none';
if(btnCerrarArriba) btnCerrarArriba.addEventListener('click', cerrarModalFunc);
if(btnCerrarAbajo) btnCerrarAbajo.addEventListener('click', cerrarModalFunc);
window.addEventListener('click', (e) => { if(e.target === modal) cerrarModalFunc(); });


function cambiarEstado(firestoreId, estadoActual) {
    const nuevoEstado = estadoActual === 'Pendiente' ? 'Registrado' : 'Pendiente';
    
    db.collection("registros_torneo").doc(firestoreId).update({
        estado: nuevoEstado
    })
    .then(() => console.log("Estado actualizado en la nube"))
    .catch((error) => alert("Error al actualizar: " + error));
}

function eliminarRegistro(firestoreId, nombreCapitan) {
    if (confirm(`¿Estás seguro de eliminar permanentemente el registro de ${nombreCapitan}?`)) {
        db.collection("registros_torneo").doc(firestoreId).delete()
        .then(() => alert("Registro eliminado de la nube"))
        .catch((error) => alert("Error al eliminar: " + error));
    }
}

function actualizarControlesPaginacion() {
    const totalPaginas = Math.ceil(equiposFiltrados.length / filasPorPagina) || 1;
    document.getElementById('infoPagina').textContent = `Página ${paginaActual} de ${totalPaginas}`;
    document.getElementById('btnAnterior').disabled = paginaActual === 1;
    document.getElementById('btnSiguiente').disabled = paginaActual === totalPaginas;
}

document.getElementById('btnAnterior').addEventListener('click', () => { 
    if(paginaActual > 1) { paginaActual--; renderizarTabla(); }
});
document.getElementById('btnSiguiente').addEventListener('click', () => { 
    const totalPaginas = Math.ceil(equiposFiltrados.length / filasPorPagina);
    if(paginaActual < totalPaginas) { paginaActual++; renderizarTabla(); }
});

function calcularInfoEdad(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    
    const hoy = new Date();
    const cumple = new Date(fechaNacimiento);
    
    // 1. Cálculo de edad actual
    let edad = hoy.getFullYear() - cumple.getFullYear();
    const m = hoy.getMonth() - cumple.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumple.getDate())) {
        edad--;
    }

    // 2. Validación según TUS límites exactos
    const limiteViejo = "2007-07-08"; 
    const limiteJoven = "2011-03-12"; 
    
    // Verificamos si está en el rango permitido
    const esApto = fechaNacimiento >= limiteViejo && fechaNacimiento <= limiteJoven;

    // 3. Días para el próximo cumple (opcional pero se ve genial)
    let proximoCumple = new Date(hoy.getFullYear(), cumple.getMonth(), cumple.getDate());
    if (hoy > proximoCumple) proximoCumple.setFullYear(hoy.getFullYear() + 1);
    const diasFaltantes = Math.ceil((proximoCumple - hoy) / (1000 * 60 * 60 * 24));

    return {
        texto: `${edad} años (${diasFaltantes} días para los ${edad + 1})`,
        color: esApto ? '#27ae60' : '#e74c3c', // Verde si es apto, Rojo si no
        apto: esApto
    };
}

cargarDatosDesdeFirebase();