document.addEventListener('DOMContentLoaded', () => {
    
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

    const checkMasculino = document.getElementById('masculino');
    const checkFemenino = document.getElementById('femenino');
    
    checkMasculino.addEventListener('change', () => { if(checkMasculino.checked) checkFemenino.checked = false; });
    checkFemenino.addEventListener('change', () => { if(checkFemenino.checked) checkMasculino.checked = false; });

    crearModales();

    let sedeActual = "Sede General";
    const tituloHtml = document.querySelector('.titulo');
    if(tituloHtml) {
        sedeActual = tituloHtml.textContent.split('|')[1].trim();
    }

    const formulario = document.getElementById('formulario');
    
    formulario.addEventListener('submit', function(e) {
        e.preventDefault(); 
        
        limpiarErrores();
        let hayErrores = false;

        const equiposRegistrados = JSON.parse(localStorage.getItem('registros_torneo')) || [];
        const dnisGlobales = obtenerDatosUnicos(equiposRegistrados, 'dni');
        const emailsGlobales = obtenerDatosUnicos(equiposRegistrados, 'email');
        const telefonosGlobales = obtenerDatosUnicos(equiposRegistrados, 'whatsapp'); 

        let dnisFormulario = [];
        let emailsFormulario = [];
        let telefonosFormulario = [];

        function marcarError(inputId, mensaje) {
            const input = document.getElementById(inputId);
            if(input) {
                input.style.borderColor = '#e74c3c'; 
                
                let pError;
                if (input.parentElement.classList.contains('input-date')) {
                    pError = input.parentElement.nextElementSibling;
                } else {
                    pError = input.nextElementSibling;
                }

                if(pError && pError.classList.contains('error')) {
                    pError.textContent = mensaje;
                    pError.style.visibility = 'visible';
                    pError.style.height = 'auto'; 
                }
            }
            hayErrores = true;
        }

        if (!checkMasculino.checked && !checkFemenino.checked) {
            const pErrorCat = document.querySelector('.bloquecheck .error');
            if(pErrorCat) {
                pErrorCat.textContent = "Debes elegir una categoría.";
                pErrorCat.style.visibility = 'visible';
            }
            hayErrores = true;
        }

        function validarJugador(prefijo, esObligatorio, esCapitan) {
            const nombre = document.getElementById(`nombre_${prefijo}`).value.trim();
            const dni = document.getElementById(`dni_${prefijo}`).value.trim();
            const nacimiento = document.getElementById(`nacimiento_${prefijo}`).value.trim();
            const email = document.getElementById(`email_${prefijo}`).value.trim().toLowerCase();
            const emergencia = document.getElementById(`emergencia_${prefijo}`).value.trim();

            if (!esObligatorio && nombre === '' && dni === '' && nacimiento === '' && email === '') return null;

            const regexSoloTexto = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

            if (nombre === '') {
                marcarError(`nombre_${prefijo}`, "El nombre es obligatorio.");
            } else if (!regexSoloTexto.test(nombre)) {
                marcarError(`nombre_${prefijo}`, "El nombre solo puede contener letras.");
            }

            const regexDni = /^\d{8}$/; 
            if (dni === '') {
                marcarError(`dni_${prefijo}`, "El DNI es obligatorio.");
            } else if (!regexDni.test(dni)) {
                marcarError(`dni_${prefijo}`, "El DNI debe tener 8 dígitos numéricos.");
            } else if (dnisFormulario.includes(dni)) {
                marcarError(`dni_${prefijo}`, "Este DNI ya está en tu equipo.");
            } else if (dnisGlobales.includes(dni)) {
                marcarError(`dni_${prefijo}`, "Este jugador ya está en otro equipo.");
            } else {
                dnisFormulario.push(dni);
            }

            if (nacimiento === '') {
                marcarError(`nacimiento_${prefijo}`, "Ingresa fecha de nacimiento.");
            } else {

                const limiteViejo = "2007-07-08";
                const limiteJoven = "2011-03-12";

                if (nacimiento < limiteViejo) {
                    marcarError(`nacimiento_${prefijo}`, "El jugador no debe cumplir 19 años antes del 7 de julio.");
                } else if (nacimiento > limiteJoven) {
                    marcarError(`nacimiento_${prefijo}`, "Debe tener 15 años cumplidos al 12 de marzo.");
                }
            }

            let whatsappValue = "";
            let direccionValue = "";

            if (esCapitan) {
                whatsappValue = document.getElementById(`whatsapp_${prefijo}`).value.trim();
                direccionValue = document.getElementById(`direccion_${prefijo}`).value.trim();

                const regexCelular = /^9\d{8}$/;

                if (whatsappValue === '') {
                    marcarError(`whatsapp_${prefijo}`, "El WhatsApp es obligatorio.");
                } else if (!regexCelular.test(whatsappValue)) {
                    marcarError(`whatsapp_${prefijo}`, "Debe empezar con 9 y tener 9 dígitos.");
                } else if (telefonosFormulario.includes(whatsappValue)) {
                    marcarError(`whatsapp_${prefijo}`, "Este número ya está en el formulario.");
                } else if (telefonosGlobales.includes(whatsappValue)) {
                    marcarError(`whatsapp_${prefijo}`, "Este número ya registró a un equipo.");
                } else {
                    telefonosFormulario.push(whatsappValue);
                }
                
                if (direccionValue === '') marcarError(`direccion_${prefijo}`, "La dirección es obligatoria.");
            }

            const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (email === '') {
                marcarError(`email_${prefijo}`, "El correo es obligatorio.");
            } else if (!regexEmail.test(email)) {
                marcarError(`email_${prefijo}`, "Ingresa un formato de correo válido (ej: nombre@link.com).");
            } else if (emailsFormulario.includes(email)) {
                marcarError(`email_${prefijo}`, "Este correo ya lo usa alguien de tu equipo.");
            } else if (emailsGlobales.includes(email)) {
                marcarError(`email_${prefijo}`, "Este correo ya está registrado en el torneo.");
            } else {
                emailsFormulario.push(email);
            }

            return { nombre, dni, nacimiento, email, emergencia, whatsapp: whatsappValue, direccion: direccionValue };
        }

        const dataCapitan = validarJugador('capitan', true, true);
        const dataJ2 = validarJugador('j2', true, false);
        const dataJ3 = validarJugador('j3', true, false);
        const dataSuplente = validarJugador('suplente', false, false) || { nombre:'', dni:'', nacimiento:'', email:'', emergencia:'' };

        const acepta = document.getElementById('acepta');
        if (!acepta.checked) {
            hayErrores = true;
        }

        if (hayErrores) {
            let msjExtra = !acepta.checked ? "No olvides aceptar las Bases y Condiciones." : "Revisa los campos en rojo.";
            mostrarModal('error', 'FALTAN DATOS ⚠️', `Para entrar a la cancha necesitamos que todo esté en regla. ${msjExtra}`);
        } else {
            
            const btnEnviar = formulario.querySelector('.boton');
            let textoOriginal = "";

            if (btnEnviar) {
                textoOriginal = btnEnviar.value;
                btnEnviar.classList.add('btn-loading');
                btnEnviar.disabled = true;
                btnEnviar.value = "ENVIANDO..."; 
            }

            const nuevoEquipo = {
                id: Date.now(), 
                sede: sedeActual,
                categoria: checkMasculino.checked ? 'Masculino' : 'Femenino',
                estado: 'Pendiente',
                capitan: { ...dataCapitan },
                j2: { ...dataJ2 },
                j3: { ...dataJ3 },
                suplente: dataSuplente ? { ...dataSuplente } : { nombre: '' },
                fechaRegistro: new Date().toISOString()
            };

            // 3. ENVIAR A FIREBASE
            db.collection("registros_torneo").add(nuevoEquipo)
            .then(() => {
                mostrarModal('exito', '¡ESTÁS CASI-DENTRO! ⚽🔥', 'Tu equipo ha sido pre-registrado con éxito, nos pondremos en contacto con el Capitán para confirmar tu registro.');
                
                const registrosLocales = JSON.parse(localStorage.getItem('registros_torneo')) || [];
                registrosLocales.push(nuevoEquipo);
                localStorage.setItem('registros_torneo', JSON.stringify(registrosLocales));

                formulario.reset();
                limpiarErrores();
            })
            .catch((error) => {
                console.error("Error en Firebase:", error);
                mostrarModal('error', 'ERROR DE CONEXIÓN', 'No pudimos registrar al equipo. Intenta de nuevo.');
            })
            .finally(() => {
                if (btnEnviar) {
                    btnEnviar.classList.remove('btn-loading');
                    btnEnviar.disabled = false;
                    btnEnviar.value = textoOriginal; 
                }
            });
        }
    });

    function limpiarErrores() {
        document.querySelectorAll('.error').forEach(p => {
            p.textContent = '';
            p.style.visibility = 'hidden';
        });
        document.querySelectorAll('.input, .input-fecha').forEach(input => {
            input.style.borderColor = '#a1a0a0';
        });
    }

    function obtenerDatosUnicos(equipos, propiedad) {
        let items = [];
        equipos.forEach(eq => {
            if(eq.capitan && eq.capitan[propiedad]) items.push(eq.capitan[propiedad].toString().toLowerCase());
            if(eq.j2 && eq.j2[propiedad]) items.push(eq.j2[propiedad].toString().toLowerCase());
            if(eq.j3 && eq.j3[propiedad]) items.push(eq.j3[propiedad].toString().toLowerCase());
            if(eq.suplente && eq.suplente[propiedad]) items.push(eq.suplente[propiedad].toString().toLowerCase());
        });
        return items;
    }

    function crearModales() {
        if(document.getElementById('modalNike')) return;
        const modalHTML = `
            <div id="modalNike" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center; padding:1rem;">
                <div style="background:#fff; max-width:400px; width:100%; padding:2.5rem 2rem; border-radius:8px; text-align:center; position:relative;">
                    <h2 id="modalNikeTitulo" style="font-size:1.6rem; font-weight:900; text-transform:uppercase; margin-bottom:1rem; font-family:'Helvetica', sans-serif;"></h2>
                    <p id="modalNikeTexto" style="font-size:1.05rem; line-height:1.5; margin-bottom:2rem; color:#333; font-weight:500; font-family:'Helvetica', sans-serif;"></p>
                    <button id="btnCerrarModalNike" style="background:#0a0b0b; color:#fff; border:none; padding:1rem 2rem; font-size:1rem; font-weight:bold; cursor:pointer; width:100%; border-radius:4px; text-transform:uppercase;">Entendido</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('btnCerrarModalNike').addEventListener('click', () => {
            document.getElementById('modalNike').style.display = 'none';
        });
    }

    function mostrarModal(tipo, titulo, texto) {
        const modal = document.getElementById('modalNike');
        const h2 = document.getElementById('modalNikeTitulo');
        h2.textContent = titulo;
        h2.style.color = tipo === 'error' ? '#e74c3c' : '#0a0b0b';
        document.getElementById('modalNikeTexto').textContent = texto;
        modal.style.display = 'flex';
    }

    document.addEventListener('input', (e) => {
        const target = e.target;
        
        if (target.id.includes('nombre')) {
            target.value = target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
        }
        
        if (target.id.includes('dni') || target.id.includes('whatsapp') || target.id.includes('emergencia')) {
            target.value = target.value.replace(/[^0-9]/g, '');
            
            if (target.id.includes('dni')) target.value = target.value.slice(0, 8);
            if (target.id.includes('whatsapp')) target.value = target.value.slice(0, 9);
        }
    });
});