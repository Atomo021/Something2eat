const GRID_SIZE = 20;
let world = [];
let agents = []; // Array para almacenar tus agentes
let messageLogElement; // Variable para almacenar la referencia al elemento del LOG de mensajes
let totalFoodCount = 0; // Contador global de comida en el mundo

// Cronómetro variables
let startTime = 0;
let timerInterval = null;
let timerElement; // Referencia al elemento HTML del cronómetro

// Clave para localStorage, usada para asegurar que se borre al morir (reiniciando memoria)
const AGENT_KNOWLEDGE_KEY = 'agent_knowledge_1';
const GAME_TIMES_HISTORY_KEY = 'mini_world_game_times'; // Nueva clave para guardar los tiempos

// Umbral de energía para activar el visual de "dolor" por hambre
const HUNGER_PAIN_THRESHOLD = 20; // Si la energía es 20 o menos, el agente muestra "dolor"

// Porcentaje de probabilidad de que un nuevo agente tenga la habilidad de nadar al nacer (ej. 0.20 = 20%)
const SWIMMING_AGENT_PERCENTAGE = 0.20;
// Esfuerzo necesario para aprender a nadar (cuántos intentos en agua sin habilidad)
const LEARNING_SWIM_THRESHOLD = 80;

// Porcentaje de probabilidad de que un nuevo agente tenga la habilidad de escalar al nacer (ej. 0.10 = 10%)
const CLIMBING_AGENT_PERCENTAGE = 0.20;
// Esfuerzo necesario para aprender a escalar (cuántos intentos en montaña sin habilidad)
const LEARNING_CLIMB_THRESHOLD = 80;

// Porcentaje de probabilidad de que un nuevo agente nazca "flojo" (no puede aprender habilidades por esfuerzo)
const LAZY_AGENT_PERCENTAGE = 0.30;

// Porcentaje de probabilidad de que un nuevo agente nazca "glotón"
const GLUTTON_AGENT_PERCENTAGE = 0.15; 

// Nuevo: Porcentaje de probabilidad de que un nuevo agente nazca "prodigio"
const PRODIGY_AGENT_PERCENTAGE = 0.15; // 15% de probabilidad de ser un prodigio

// Nuevo: Porcentaje de probabilidad de que un nuevo agente nazca "borracho"
const DRUNK_AGENT_PERCENTAGE = 0.20;

// Umbral de intentos consecutivos al mismo bloque destino para que el agente se "atasque"
const STUCK_THRESHOLD = 3; 

// --- Funciones para cargar/guardar conocimiento (aseguran reinicio de memoria) ---
function loadAgentKnowledge() {
    return null; // El agente siempre empieza sin conocimiento previo de vidas anteriores
}

function saveAgentKnowledge(knowledge) {
    console.log("No se guarda conocimiento persistente en esta configuración.");
}

// --- Función para registrar mensajes en el log de la web ---
function logMessage(message, color = '#00FFFF') { // Color por defecto cian
    if (messageLogElement) {
        const p = document.createElement('p');
        p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`; // Añadir timestamp
        p.style.color = color;
        messageLogElement.appendChild(p);
        // Desplazarse al final para ver los mensajes más recientes
        messageLogElement.scrollTop = messageLogElement.scrollHeight;
    }
}

// --- Funciones del Cronómetro ---
function startTimer() {
    startTime = Date.now();
    if (timerInterval) clearInterval(timerInterval); // Asegurarse de limpiar cualquier intervalo anterior
    timerInterval = setInterval(updateTimer, 100); // Actualizar cada 100 milisegundos para mostrar milisegundos
    updateTimer(); // Actualizar inmediatamente al iniciar
}

function updateTimer() {
    const elapsedTime = Date.now() - startTime;
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor(elapsedTime % 1000); // Calcular los milisegundos restantes

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');
    const formattedMilliseconds = String(milliseconds).padStart(3, '0'); // Formatear milisegundos con 3 dígitos

    if (timerElement) {
        timerElement.textContent = `Tiempo: ${formattedMinutes}:${formattedSeconds}:${formattedMilliseconds}`; // Mostrar milisegundos
    }
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

// --- Configuración del Mundo ---
function initializeWorld() {
    totalFoodCount = 0; // Reiniciar el contador de comida al inicializar el mundo
    for (let y = 0; y < GRID_SIZE; y++) {
        world[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            let rand = Math.random();
            // Los umbrales están en orden ascendente, priorizando la rareza de los elementos.
            // La suma de las probabilidades es 100%, asegurando que no haya espacios vacíos.

            // 1. Elementos menos comunes (árboles y comida, 2.5% cada uno)
            if (rand < 0.025) {
                world[y][x] = 'A'; // 2.5% Árbol
            } else if (rand < 0.05) {
                world[y][x] = 'C'; // Mantener 'C' como representación visual
                totalFoodCount++; // Incrementar el contador de comida
            }
            // 2. Elementos de frecuencia media (rocas, 5%)
            else if (rand < 0.10) {
                world[y][x] = 'r'; // 5% Roca
            }
            // 3. Elementos un poco más comunes (montañas, 10%)
            else if (rand < 0.20) {
                world[y][x] = 'm'; // 10% Montaña
            }
            // 4. Elementos más comunes (agua y pasto, 40% cada uno)
            else if (rand < 0.60) {
                world[y][x] = 'a'; // 40% Agua
            } else {
                world[y][x] = 'p'; // 40% Pasto
            }
        }
    }
}

// --- Clase o Constructor para Agentes ---
function Agent(id, startX, startY) {
    this.id = id;
    this.x = startX;
    this.y = startY;
    this.energy = 100;
    this.isAlive = true;
    this.knowledge = {};
    this.seekingFood = false;
    
    this.swimEffort = 0; 
    this.climbEffort = 0;
    
    this.isLazy = Math.random() < LAZY_AGENT_PERCENTAGE;
    this.isGlutton = Math.random() < GLUTTON_AGENT_PERCENTAGE;
    this.isProdigy = Math.random() < PRODIGY_AGENT_PERCENTAGE;
    this.isDrunk = Math.random() < DRUNK_AGENT_PERCENTAGE;

    // Propiedades que indican si el agente puede aprender una habilidad específica por esfuerzo
    this.canSwim = false;
    this.canClimb = false;
    this.canLearnSwimThroughEffort = false;
    this.canLearnClimbThroughEffort = false;

    // Contadores para el agente borracho
    this.waterAttemptCounter = 0;
    this.consecutiveMountainAttempts = 0;

    // Lógica para asignar la capacidad inicial de nadar/escalar y la capacidad de aprendizaje
    if (this.isProdigy) {
        this.canSwim = Math.random() < SWIMMING_AGENT_PERCENTAGE;
        this.canClimb = Math.random() < CLIMBING_AGENT_PERCENTAGE;
        this.canLearnSwimThroughEffort = !this.canSwim; // Prodigios pueden aprender si no tienen la habilidad
        this.canLearnClimbThroughEffort = !this.canClimb; // Prodigios pueden aprender si no tienen la habilidad
    } else { // Para agentes NO prodigio
        // Los agentes perezosos o borrachos no pueden aprender por esfuerzo, y tampoco pueden nacer con ambas.
        if (this.isLazy || this.isDrunk) {
            const hasSwimAtBirth = Math.random() < SWIMMING_AGENT_PERCENTAGE;
            const hasClimbAtBirth = Math.random() < CLIMBING_AGENT_PERCENTAGE;

            if (hasSwimAtBirth && hasClimbAtBirth) {
                // Si ambas probabilidades se activan, elegimos una aleatoriamente
                // para asegurar que no tengan ambas al nacer
                if (Math.random() < 0.5) {
                    this.canSwim = true;
                } else {
                    this.canClimb = true;
                }
            } else if (hasSwimAtBirth) {
                this.canSwim = true;
            } else if (hasClimbAtBirth) {
                this.canClimb = true;
            }
            // Por defecto, canLearnSwimThroughEffort y canLearnClimbThroughEffort son false
            // para agentes perezosos o borrachos, lo cual es el comportamiento deseado.
        } else { // Agentes normales (ni prodigio, ni perezosos, ni borrachos)
            const willBeBornWithSwim = Math.random() < SWIMMING_AGENT_PERCENTAGE;
            const willBeBornWithClimb = Math.random() < CLIMBING_AGENT_PERCENTAGE;

            if (willBeBornWithSwim && willBeBornWithClimb) {
                // Si ambos "sorteos" son verdaderos, solo puede tener una de las dos.
                // Asignamos una aleatoriamente y la otra no la tendrá ni la podrá aprender.
                if (Math.random() < 0.5) { // 50% de probabilidad de tener Nadar
                    this.canSwim = true;
                    this.canLearnClimbThroughEffort = false; // No puede aprender la otra
                } else { // 50% de probabilidad de tener Escalar
                    this.canClimb = true;
                    this.canLearnSwimThroughEffort = false; // No puede aprender la otra
                }
            } else if (willBeBornWithSwim) {
                this.canSwim = true;
                this.canLearnClimbThroughEffort = false; // Si ya tiene nadar, no puede aprender a escalar
            } else if (willBeBornWithClimb) {
                this.canClimb = true;
                this.canLearnSwimThroughEffort = false; // Si ya tiene escalar, no puede aprender a nadar
            } else {
                // Si no nace con ninguna habilidad, se le permite aprender UNA de ellas por esfuerzo.
                if (Math.random() < 0.5) { // 50% de probabilidad de aprender Nadar
                    this.canLearnSwimThroughEffort = true;
                } else { // 50% de probabilidad de aprender Escalar
                    this.canLearnClimbThroughEffort = true;
                }
            }
        }
    }

    // Nuevas propiedades para la lógica de "atasco" por movimiento repetitivo al mismo destino
    this.lastTargetLocation = { x: null, y: null };
    this.consecutiveSameTargetMoves = 0;
    
    // Método para encontrar la comida más cercana
    this.findNearestFood = function() {
        let nearestFood = null;
        let minDistance = Infinity;

        for (let y = 0; y < GRID_SIZE; y++) {
            // Verificación defensiva para la existencia de la fila
            if (!world[y]) {
                console.error(`DEBUG ERROR in findNearestFood: world[${y}] is undefined or null. Skipping row.`);
                continue; // Saltar esta fila
            }
            for (let x = 0; x < GRID_SIZE; x++) {
                // Verificación defensiva para el tipo de contenido de la celda
                if (typeof world[y][x] !== 'string') {
                    console.error(`DEBUG ERROR in findNearestFood: world[${y}][${x}] is not a string. Type: ${typeof world[y][x]}, Value: ${world[y][x]}. Skipping cell.`);
                    continue; // Saltar esta celda
                }
                
                if (world[y][x] === 'C') { // Mantener 'C' como la búsqueda de comida
                    const distance = Math.abs(this.x - x) + Math.abs(this.y - y); // Distancia de Manhattan
                    if (distance < minDistance) {
                        minDistance = distance; 
                        nearestFood = { x: x, y: y };
                    }
                }
            }
        }
        return nearestFood; 
    };

    // Helper para verificar si una celda es transitable para este agente
    // Se asume que cellContent es un valor válido (no undefined o null).
    this.isCellWalkableForMove = function(cellContent) {
        // Rocas son SIEMPRE intransitables para todos los agentes
        if (cellContent === 'r') { 
            return false;
        }

        // Para agentes NO borrachos, la transitabilidad de agua/montaña depende de sus habilidades
        if (!this.isDrunk) {
            if (cellContent === 'm' && !this.canClimb) {
                return false;
            }
            if (cellContent === 'a' && !this.canSwim) {
                return false;
            }
        }
        // Para agentes borrachos, si llega aquí significa que no es roca,
        // y la lógica de agua/montaña específica para ellos se manejará directamente en move().
        // Por defecto, otros terrenos son transitables.
        return true; 
    };

    this.move = function() {
        if (!this.isAlive) return;

        let currentX = this.x;
        let currentY = this.y;
        let intendedX = currentX; // La celda a la que el agente *quiere* moverse (antes de bloqueos)
        let intendedY = currentY;
        let finalX = currentX;   // La celda a la que el agente *realmente* se mueve
        let finalY = currentY;

        // --- Consumo de Energía ---
        if (this.isDrunk) {
            this.energy -= (Math.floor(Math.random() * 5) + 1); // Agente borracho consume 1-5 energía (velocidad desigual)
        } else {
            this.energy--; // Agente normal consume 1 energía
        }

        // --- Determinar Movimiento Intencionado ---
        if (this.isDrunk) {
            let possibleMoves = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    let nextX = currentX + dx;
                    let nextY = currentY + dy;
                    // Agentes borrachos pueden intentar moverse a cualquier celda adyacente (incluyendo la actual) dentro de los límites
                    if (nextX >= 0 && nextX < GRID_SIZE && nextY >= 0 && nextY < GRID_SIZE) {
                        possibleMoves.push({ x: nextX, y: nextY });
                    }
                }
            }
            if (possibleMoves.length > 0) {
                let randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
                intendedX = randomMove.x;
                intendedY = randomMove.y;
            }
            // Si no hay movimientos posibles (ej. rodeado por fuera de límites), se queda quieto.
            // Esta es la *intención cruda* del agente borracho.
            
        } else { // Lógica de movimiento inteligente para agentes no borrachos
            let potentialMoves = [];
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    let nextX = currentX + dx;
                    let nextY = currentY + dy;
                    const isStayingPut = (dx === 0 && dy === 0);

                    // 1. VERIFICACIÓN DE LÍMITES PRIMERO
                    if (nextX < 0 || nextX >= GRID_SIZE || nextY < 0 || nextY >= GRID_SIZE) {
                        continue; // Fuera de límites, no es un movimiento posible
                    }

                    // 2. ACCESO DEFENSIVO AL CONTENIDO DE LA CELDA
                    let cellContent;
                    if (Array.isArray(world[nextY]) && typeof world[nextY][nextX] !== 'undefined') {
                        cellContent = world[nextY][nextX];
                    } else {
                        console.error(`DEBUG ERROR: Celda del mundo en (${nextX},${nextY}) es inválida durante la consideración del movimiento.`);
                        continue; // Saltar esta celda si es inválida (ej. falta la fila, falta el contenido de la celda)
                    }

                    // 3. DETERMINAR TRANSITABILIDAD BASADO EN EL CONTENIDO DE LA CELDA Y LAS HABILIDADES DEL AGENTE
                    const isWalkable = this.isCellWalkableForMove(cellContent);

                    if (isWalkable) {
                        potentialMoves.push({ x: nextX, y: nextY, isStayingPut: isStayingPut });
                    } else { // La celda no es transitable (es una celda válida, pero contiene un obstáculo)
                        if (!isStayingPut && !this.isLazy) {
                            // Ahora, usar cellContent de forma segura para la lógica de aprendizaje
                            if (cellContent === 'm' && !this.canClimb && this.canLearnClimbThroughEffort) {
                                this.climbEffort++;
                                if (this.climbEffort >= LEARNING_CLIMB_THRESHOLD) {
                                    this.canClimb = true;
                                    this.climbEffort = 0;
                                    logMessage(`¡Soms ${this.id} aprendió a escalar por esfuerzo!`, '#00FF00'); // Cambiado "Agente" a "Soms"
                                }
                            } else if (cellContent === 'a' && !this.canSwim && this.canLearnSwimThroughEffort) {
                                this.swimEffort++;
                                if (this.swimEffort >= LEARNING_SWIM_THRESHOLD) {
                                    this.canSwim = true;
                                    this.swimEffort = 0;
                                    logMessage(`¡Soms ${this.id} aprendió a nadar por esfuerzo!`, '#00FF00'); // Cambiado "Agente" a "Soms"
                                }
                            }
                        }
                    }
                }
            }

            let chosenMove = null;
            if (this.energy < 70 || this.isGlutton) {
                this.seekingFood = true;
                let foodLocation = this.findNearestFood();
                if (foodLocation) {
                    let minDistance = Infinity;
                    let movesToConsiderForFood = potentialMoves.filter(move => !move.isStayingPut || (move.isStayingPut && potentialMoves.length === 1));
                    movesToConsiderForFood.forEach(move => {
                        const dist = Math.abs(foodLocation.x - move.x) + Math.abs(foodLocation.y - move.y);
                        if (dist < minDistance) {
                            minDistance = dist;
                            chosenMove = move;
                        }
                    });
                }
            } else {
                this.seekingFood = false;
            }

            if (!chosenMove && potentialMoves.length > 0) {
                let actualMoves = potentialMoves.filter(move => !move.isStayingPut);
                if (actualMoves.length > 0) {
                    chosenMove = actualMoves[Math.floor(Math.random() * actualMoves.length)];
                } else {
                    chosenMove = potentialMoves.find(move => move.isStayingPut) || potentialMoves[0];
                }
            }
            if (chosenMove) {
                intendedX = chosenMove.x;
                intendedY = chosenMove.y;
            } else {
                intendedX = currentX;
                intendedY = currentY;
            }
        } // Fin de la lógica de movimiento para agentes no borrachos

        // --- Lógica de Sobreescritura de Obstáculos Específica para Agentes Borrachos ---
        let wasDrunkObstacleAttempt = false; // Flag para resetear contadores de atasco general si hubo un intento de obstáculo borracho

        // **INICIO DE LA REESTRUCTURACIÓN DEL BLOQUE CONDICIONAL**
        if (this.isDrunk) { // Si el agente es borracho
            if (intendedX !== currentX || intendedY !== currentY) { // Si intenta moverse a una nueva celda
                // Defensive check before accessing world[intendedY][intendedX]
                if (Array.isArray(world[intendedY]) && typeof world[intendedY][intendedX] !== 'undefined') {
                    const cellContentAtIntended = world[intendedY][intendedX];

                    // Aquí usamos `cellContentAtIntended` que ya está garantizado ser válido
                    if (cellContentAtIntended === 'a') { // Intentando moverse al agua
                        this.waterAttemptCounter++;
                        logMessage(`Soms Borracho ${this.id} intentó entrar al agua (${this.waterAttemptCounter}/15)`, 'grey'); // Cambiado "Agente" a "Soms"
                        if (this.waterAttemptCounter >= 15) {
                            this.isAlive = false;
                            logMessage(`¡Soms Borracho ${this.id} se ahogó en el agua!`, 'red'); // Cambiado "Agente" a "Soms"
                            stopTimer(); 
                        }
                        finalX = currentX; // Se queda quieto
                        finalY = currentY;
                        wasDrunkObstacleAttempt = true;
                        this.consecutiveMountainAttempts = 0; // Resetear otro contador
                    } else if (cellContentAtIntended === 'm') { // Intentando moverse a la montaña
                        this.consecutiveMountainAttempts++;
                        logMessage(`Soms Borracho ${this.id} intentó escalar la montaña (${this.consecutiveMountainAttempts}/10)`, 'grey'); // Cambiado "Agente" a "Soms"
                        if (this.consecutiveMountainAttempts >= 10) {
                            logMessage(`¡Soms Borracho ${this.id} se tropezó por la montaña tras insistir!`, 'orange'); // Cambiado "Agente" a "Soms"
                            finalX = intendedX; // Pasa temporalmente
                            finalY = intendedY;
                            this.consecutiveMountainAttempts = 0; // Resetear tras pasar con éxito
                            this.waterAttemptCounter = 0; // Resetear otro contador
                        } else {
                            finalX = currentX; // Se queda quieto
                            finalY = currentY;
                            wasDrunkObstacleAttempt = true;
                            this.waterAttemptCounter = 0; // Resetear otro contador
                        }
                    } else if (cellContentAtIntended === 'r') { // Intentando moverse a una roca (siempre intransitable)
                        finalX = currentX; // Se queda quieto
                        finalY = currentY;
                        wasDrunkObstacleAttempt = true;
                        this.waterAttemptCounter = 0; // Resetear contadores
                        this.consecutiveMountainAttempts = 0;
                    } else { // El agente borracho se mueve a una celda normal transitable
                        finalX = intendedX;
                        finalY = intendedY;
                        this.waterAttemptCounter = 0; // Resetear contadores
                        this.consecutiveMountainAttempts = 0;
                    }
                } else { // Target cell is invalid (undefined world[y] or world[y][x]) for drunk agent
                    console.error(`DEBUG ERROR in Agent.move (ruta de borracho): world[${intendedY}][${intendedX}] es inválido. Saltando lógica de obstáculo de borracho.`);
                    finalX = currentX; // Quedarse quieto si la celda de destino es inválida
                    finalY = currentY;
                    wasDrunkObstacleAttempt = true; // Considerarlo un intento para evitar la lógica de atasco general
                    this.waterAttemptCounter = 0;
                    this.consecutiveMountainAttempts = 0;
                }
            } else { // Agente borracho decidió quedarse quieto
                finalX = currentX;
                finalY = currentY;
                // No resetear los contadores de intentos de agua/montaña si simplemente no intentó moverse a una nueva celda específica.
            }
        } else { // Si el agente NO es borracho
            // Para agentes no borrachos, finalX/finalY ya se establecen en el bucle de movimiento
            // basándose en potentialMoves y isCellWalkableForMove.
            // Si no se encontró un chosenMove transitable, intendedX/Y ya sería currentX/Y
            // y el agente se quedaría quieto.
            finalX = intendedX; 
            finalY = intendedY;
        }
        // **FIN DE LA REESTRUCTURACIÓN DEL BLOQUE CONDICIONAL**

        // --- Lógica Universal de "Atasco" (se aplica a `finalX`, `finalY` contra `currentX`, `currentY`) ---
        // Esto gestiona agentes que intentan ir repetidamente al *mismo lugar efectivo*.
        // Esta lógica ya considera movimientos diagonales, ya que compara las coordenadas x e y del destino.
        // Si el agente intenta moverse a una celda diagonal y es bloqueado, y luego intenta
        // moverse a la misma celda diagonal de nuevo, el contador de estancamiento se incrementará.
        if (!this.isDrunk || !wasDrunkObstacleAttempt) { // Si no es borracho, o si es borracho pero no fue bloqueado por una regla de obstáculo específico de borracho
            if (finalX === currentX && finalY === currentY) {
                // Si el agente se quedó quieto este turno, resetear movimientos consecutivos al objetivo
                this.consecutiveSameTargetMoves = 0;
                this.lastTargetLocation = { x: null, y: null };
            } else { // El agente intentó moverse a un nuevo lugar (finalX, finalY)
                if (this.lastTargetLocation.x === finalX && this.lastTargetLocation.y === finalY) {
                    this.consecutiveSameTargetMoves++;
                } else {
                    this.consecutiveSameTargetMoves = 1;
                }
                this.lastTargetLocation = { x: finalX, y: finalY };

                if (this.consecutiveSameTargetMoves >= STUCK_THRESHOLD) {
                    logMessage(`Soms ${this.id} se siente atascado moviéndose repetidamente a (${finalX},${finalY}). Busca nueva ruta.`, 'orange'); // Cambiado "Agente" a "Soms"
                    finalX = currentX; // Forzar al agente a quedarse quieto por este turno
                    finalY = currentY;
                    this.consecutiveSameTargetMoves = 0; // Resetear contador para la evaluación del próximo turno
                    this.lastTargetLocation = { x: null, y: null }; // Limpiar objetivo para forzar nueva elección
                }
            }
        }
        
        // Aplicar la posición final determinada
        this.x = finalX;
        this.y = finalY;

        // Comprobación de muerte (después de todos los movimientos y consumo de energía)
        if (this.energy <= 0) {
            this.isAlive = false;
            stopTimer(); 
            localStorage.removeItem(AGENT_KNOWLEDGE_KEY);
            logMessage(`¡Soms ${this.id} ha muerto! ¡Conocimiento completamente perdido!`, 'red'); // Cambiado "Agente" a "Soms"
        }
    };

    this.act = function() {
        if (!this.isAlive) return;

        if (world[this.y][this.x] === 'C') { // Mantener 'C' como la comprobación
            this.energy += 30;
            if (this.energy > 100) {
                this.energy = 100;
            }
            world[this.y][this.x] = 'p';
            totalFoodCount--;
            
            console.log("No se guarda conocimiento persistente en esta configuración."); 

            logMessage(`Soms ${this.id} comió Coconut Super! Energía: ${this.energy} (Coconut Super restante: ${totalFoodCount})`, '#00FFFF'); // Cambiar el nombre en el log
        }
    };
}

// --- Funciones de Dibujo y Actualización ---
function drawWorld() {
    let displayGridContent = '';
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            let charToDisplay = world[y][x];
            let cssClass = '';

            let agentOnCell = agents.find(agent => agent.x === x && agent.y === y);

            if (agentOnCell) {
                if (agentOnCell.isAlive) {
                    charToDisplay = agentOnCell.id.toString();
                    cssClass = 'agent-live';
                    if (agentOnCell.energy <= HUNGER_PAIN_THRESHOLD) {
                        cssClass += ' agent-hungry';
                    }
                    if (agentOnCell.canSwim) {
                        cssClass += ' agent-swimmer';
                    }
                    if (agentOnCell.canClimb) {
                        cssClass += ' agent-climber';
                    }
                    if (agentOnCell.isLazy) {
                        cssClass += ' agent-lazy';
                    }
                    if (agentOnCell.isGlutton) {
                        cssClass += ' agent-glutton';
                    }
                    if (agentOnCell.isProdigy) { // Nuevo: Clase para prodigio
                        cssClass += ' agent-prodigy';
                    }
                    if (agentOnCell.isDrunk) { // Nuevo: Clase para borracho
                        cssClass += ' agent-drunk';
                    }
                } else {
                    charToDisplay = 'D';
                    cssClass = 'agent-dead';
                }
            } else {
                switch (charToDisplay) {
                    case 'm': cssClass = 'char-m'; break;
                    case 'a': cssClass = 'char-a'; break;
                    case 'p': cssClass = 'char-p'; break;
                    case 'r': cssClass = 'char-r'; break;
                    case 'A': cssClass = 'char-A'; break;
                    case 'C': cssClass = 'char-C'; break; // Mantener 'C' para el estilo visual
                    case ' ': cssClass = 'char-empty'; break;
                    default: cssClass = ''; break;
                }
            }
            displayGridContent += `<span class="${cssClass}">${charToDisplay}</span>`;
        }
        displayGridContent += '\n';
    }

    const gridElement = document.getElementById('game-grid');
    gridElement.innerHTML = displayGridContent;
}

// Helper function to convert time string (MM:SS:MMM) to milliseconds
function timeToMilliseconds(timeString) {
    // Defensive check for timeString being a valid string
    if (typeof timeString !== 'string' || !timeString) {
        console.warn('Invalid time string received by timeToMilliseconds:', timeString);
        return Infinity; // Return a very large number for invalid times, effectively pushing them to the end
    }

    const parts = timeString.split(':');
    // Ensure all parts exist before parsing
    if (parts.length !== 3) {
        console.warn('Malformed time string format in timeToMilliseconds:', timeString);
        return Infinity; // Handle unexpected format
    }

    const minutes = parseInt(parts[0], 10);
    const seconds = parseInt(parts[1], 10);
    const milliseconds = parseInt(parts[2], 10);

    // Basic validation for parsed numbers
    if (isNaN(minutes) || isNaN(seconds) || isNaN(milliseconds)) {
        console.warn('Could not parse time components in timeToMilliseconds:', timeString);
        return Infinity; // Handle non-numeric components
    }

    return (minutes * 60 * 1000) + (seconds * 1000) + milliseconds;
}

function updateSimulation() {
    try { 
        agents.forEach(agent => {
            if (agent.isAlive && (totalFoodCount > 0 || simulationInterval !== null)) {
                try { 
                    agent.move();
                    agent.act();
                } catch (agentError) {
                    console.error(`ERROR EN SOMS ${agent.id}:`, agentError); // Cambiado "Agente" a "Soms"
                    agent.isAlive = false; 
                    logMessage(`¡Soms ${agent.id} ha muerto por un error inesperado!`, 'red'); // Cambiado "Agente" a "Soms"
                    stopTimer(); 
                    clearInterval(simulationInterval); 
                    simulationInterval = null; 
                    document.getElementById('startButton').disabled = true;
                    document.getElementById('stepButton').disabled = true;
                }
            }
        });
        drawWorld();

        if (agents.length > 0) {
            const agent = agents[0];
            const statusElement = document.getElementById('agent1-status');
            if (agent.isAlive) {
                statusElement.textContent = `Energía: ${agent.energy} | Nada: ${agent.canSwim ? 'Sí' : 'No'}${agent.canLearnSwimThroughEffort && !agent.canSwim ? ' (Esf.)' : ''} | Escala: ${agent.canClimb ? 'Sí' : 'No'}${agent.canLearnClimbThroughEffort && !agent.canClimb ? ' (Esf.)' : ''} | Flojo: ${agent.isLazy ? 'Sí' : 'No'} | Glotón: ${agent.isGlutton ? 'Sí' : 'No'} | Prodigio: ${agent.isProdigy ? 'Sí' : 'No'} | Borracho: ${agent.isDrunk ? 'Sí' : 'No'}`; 
                statusElement.style.color = '#eeeeee';
            } else {
                statusElement.textContent = `Soms 1: Muerto`; // Cambiado "Agente" a "Soms"
                statusElement.style.color = 'red';
            }
        }

        if (totalFoodCount === 0 && simulationInterval !== null) {
            stopTimer(); 
            clearInterval(simulationInterval); 
            simulationInterval = null; 
            
            const finalTime = timerElement.textContent.replace('Tiempo: ', '');
            const gameDate = new Date().toLocaleString(); 

            let gameTimes = JSON.parse(localStorage.getItem(GAME_TIMES_HISTORY_KEY) || '[]');
            gameTimes.push({ time: finalTime, date: gameDate }); 
            localStorage.setItem(GAME_TIMES_HISTORY_KEY, JSON.stringify(gameTimes));
            
            displayGameHistory();

            const gridElement = document.getElementById('game-grid');
            gridElement.innerHTML = `<p style="font-size: 1.5em; color: yellow; text-align: center;">¡FIN DE LA PARTIDA!</p><p style="font-size: 1em; color: white; text-align: center;">Toda la Coconut Super ha sido consumida en ${finalTime} el ${gameDate}.</p>`; // Cambiar el nombre en el mensaje final
            gridElement.style.border = 'none'; 
            gridElement.style.boxShadow = 'none'; 

            logMessage(`¡Juego Terminado! Toda la Coconut Super ha sido consumida en ${finalTime} el ${gameDate}.`, 'yellow'); // Cambiar el nombre en el log final
            document.getElementById('startButton').disabled = true;
            document.getElementById('stepButton').disabled = true;
        }
    } catch (simError) {
        console.error("ERROR CRÍTICO EN updateSimulation:", simError);
        stopTimer(); 
        clearInterval(simulationInterval);
        simulationInterval = null;
        logMessage("¡ERROR CRÍTICO EN LA SIMULACIÓN! Juego detenido. Revisa la consola para más detalles.", 'red');
        document.getElementById('startButton').disabled = true;
        document.getElementById('stepButton').disabled = true;
    }
}

// --- Funciones para manejar el historial de tiempos ---
function displayGameHistory() {
    const historyContainer = document.getElementById('game-times-history');
    let gameTimes = [];
    try {
        // Intenta parsear los datos existentes. Si está mal formado, usa un array vacío.
        const storedData = localStorage.getItem(GAME_TIMES_HISTORY_KEY);
        if (storedData) {
            gameTimes = JSON.parse(storedData);
        }
    } catch (e) {
        console.error("Error al parsear el historial de partidas desde localStorage:", e);
        // Si el parseo falla, trata los datos como inválidos y límpialos para evitar futuros errores
        localStorage.removeItem(GAME_TIMES_HISTORY_KEY);
        gameTimes = [];
    }

    // Filtra cualquier entrada que no tenga una propiedad 'time' válida (ej. null, undefined, o no-string)
    gameTimes = gameTimes.filter(entry => entry && typeof entry.time === 'string' && entry.time.length > 0);

    if (gameTimes.length === 0) {
        historyContainer.innerHTML = '<p>No hay tiempos registrados aún.</p>';
    } else {
        // Ordenar los tiempos de juego por el tiempo más rápido (milisegundos)
        gameTimes.sort((a, b) => {
            // Se asume que a.time y b.time ya son cadenas válidas gracias al filtro anterior
            return timeToMilliseconds(a.time) - timeToMilliseconds(b.time);
        });

        const ul = document.createElement('ul');
        gameTimes.forEach(entry => {
            const li = document.createElement('li');
            li.textContent = `Tiempo: ${entry.time} - Fecha: ${entry.date}`;
            ul.appendChild(li);
        });
        historyContainer.innerHTML = ''; 
        historyContainer.appendChild(ul);
    }
}

// --- Inicialización y Control ---
let simulationInterval;

document.getElementById('startButton').addEventListener('click', () => {
    if (simulationInterval) clearInterval(simulationInterval);
    stopTimer(); 
    initializeWorld();
    agents = [
        new Agent(1, Math.floor(GRID_SIZE/2), Math.floor(GRID_SIZE/2))
    ];
    drawWorld();
    startTimer(); 
    simulationInterval = setInterval(updateSimulation, 750); 
    
    if (messageLogElement) {
        messageLogElement.innerHTML = '';
        logMessage("Simulación iniciada. ¡Buena suerte, Soms!"); // Cambiado "agente" a "Soms"
    }
    document.getElementById('startButton').disabled = false;
    document.getElementById('stepButton').disabled = false;

    const gridElement = document.getElementById('game-grid');
    gridElement.style.border = '1px solid #00ff00';
    gridElement.style.boxShadow = '0 0 10px rgba(0, 255, 0, 0.5)';
});

document.getElementById('stepButton').addEventListener('click', () => {
    if (totalFoodCount === 0) { 
        return;
    }
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
        stopTimer(); 
    } else {
        startTimer(); 
    }
    updateSimulation(); 
});

document.getElementById('toggleHistoryButton').addEventListener('click', () => {
    const historyContainer = document.getElementById('game-times-history');
    const button = document.getElementById('toggleHistoryButton');
    if (historyContainer.style.display === 'none') {
        historyContainer.style.display = 'block';
        button.textContent = 'Ocultar Historial';
    } else {
        historyContainer.style.display = 'none';
        button.textContent = 'Mostrar Historial';
    }
});


// Iniciar con un mensaje inicial al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const gridElement = document.getElementById('game-grid');
    gridElement.textContent = "Pulsa 'Iniciar Simulación' para empezar.";
    messageLogElement = document.getElementById('message-log'); 
    timerElement = document.getElementById('game-timer'); 
    timerElement.textContent = 'Tiempo: 00:00:000'; 

    logMessage("Bienvenido al Mini-Mundo. Pulsa 'Iniciar Simulación'.");
    displayGameHistory(); 
});
