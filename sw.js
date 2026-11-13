<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Foco de Tareas - Matriz Eisenhower</title>
  <link rel="manifest" href="manifest.json">
  <style>
    body { background-color: #121212; color: #a8b5a2; font-family: monospace; padding: 20px; text-align: center; margin: 0; }
    input, select, button { background: #1e1e1e; border: 1px solid #444; color: #a8b5a2; padding: 12px; margin: 8px 5px; border-radius: 2px; font-family: monospace; font-size: 16px; width: 90%; max-width: 400px; box-sizing: border-box; }
    button { cursor: pointer; border-color: #a8b5a2; font-weight: bold; margin-top: 20px; }
    button:hover { background: #2a2a2a; }
    #task-display { font-size: 1.2em; margin: 40px auto; padding: 30px; border: 1px dashed #555; background: #1a1a1a; display: none; max-width: 500px; }
    .hidden { display: none !important; }
    label { display: block; text-align: left; max-width: 400px; margin: 15px auto 5px auto; font-size: 0.85em; color: #777; }
    .task-meta { font-size: 0.8em; color: #888; margin-bottom: 30px; background: #222; padding: 15px; border-left: 3px solid #555; text-align: left; }
    .highlight { color: #d1dcd1; font-weight: bold; }
  </style>
</head>
<body>
  <h2>FOCO DE TAREAS</h2>

  <div id="add-task-section">
    <input type="text" id="task-name" placeholder="Nombre de la tarea, examen o hábito...">
    
    <label>¿Qué tipo de actividad es?</label>
    <select id="task-type" onchange="toggleDate()">
      <option value="general">Tarea General / Hábito</option>
      <option value="examen">Examen</option>
      <option value="trabajo">Trabajo / Proyecto Universitario</option>
    </select>

    <div id="date-container" class="hidden">
      <label>¿Para cuándo es la entrega o examen?</label>
      <input type="date" id="task-date">
    </div>

    <label>Nivel de Importancia (Eisenhower)</label>
    <select id="task-importance">
      <option value="3">Alta (Vital para mis objetivos/notas)</option>
      <option value="2">Media (Mejora mi rutina, pero no es crítica)</option>
      <option value="1">Baja (Deseable, pero puedo vivir sin hacerla)</option>
    </select>

    <div id="urgency-container">
      <label>Nivel de Urgencia</label>
      <select id="task-urgency">
        <option value="3">Alta (Para hoy o mañana)</option>
        <option value="2">Media (Para esta semana)</option>
        <option value="1">Baja (Cuando haya tiempo libre)</option>
      </select>
    </div>

    <label>Complejidad y Tamaño</label>
    <select id="task-size">
      <option value="1">Corta / Rápida</option>
      <option value="2">Mediana / Requiere concentración</option>
      <option value="3">Larga / Muy compleja</option>
    </select>

    <button onclick="addTask()">Calcular Prioridad y Añadir</button>
  </div>

  <p id="task-count">Actividades en cola: 0</p>
  <button id="start-btn" onclick="startTasks()">INICIAR RUTINA</button>

  <div id="task-display">
    <p>TAREA PRIORITARIA:</p>
    <div id="current-task-text" style="font-size: 1.3em; margin-bottom: 15px; font-weight: bold; color: #d1dcd1;"></div>
    
    <div class="task-meta" id="task-meta-info">
      <!-- Aquí se inyectan los tiempos -->
    </div>
    
    <button onclick="completeTask()">LISTO (Siguiente)</button>
  </div>

  <script>
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js');
    }

    // Usamos v3 para borrar cualquier rastro del sistema de la IA anterior
    let tasks = JSON.parse(localStorage.getItem('foco_tasks_v3')) || [];

    function toggleDate() {
      const type = document.getElementById('task-type').value;
      if(type === 'examen' || type === 'trabajo') {
        document.getElementById('date-container').classList.remove('hidden');
        document.getElementById('urgency-container').classList.add('hidden');
      } else {
        document.getElementById('date-container').classList.add('hidden');
        document.getElementById('urgency-container').classList.remove('hidden');
      }
    }

    function updateCount() {
      document.getElementById('task-count').innerText = `Actividades en cola: ${tasks.length}`;
      localStorage.setItem('foco_tasks_v3', JSON.stringify(tasks));
    }

    function addTask() {
      const name = document.getElementById('task-name').value.trim();
      const type = document.getElementById('task-type').value;
      const importance = parseInt(document.getElementById('task-importance').value);
      const size = parseInt(document.getElementById('task-size').value);
      
      if(name === '') return alert('Por favor escribe un nombre para la tarea.');

      let urgencyScore = 0;
      let dateValue = null;

      // CÁLCULO MATEMÁTICO DE URGENCIA
      if(type === 'examen' || type === 'trabajo') {
        dateValue = document.getElementById('task-date').value;
        if(!dateValue) return alert('Debes poner una fecha para el examen/trabajo.');
        
        const taskDate = new Date(dateValue);
        const today = new Date();
        const diffTime = taskDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays <= 1) urgencyScore = 4; // Máxima urgencia
        else if (diffDays <= 3) urgencyScore = 3;
        else if (diffDays <= 7) urgencyScore = 2;
        else urgencyScore = 1;
      } else {
        urgencyScore = parseInt(document.getElementById('task-urgency').value);
      }

      // MATRIZ DE EISENHOWER: Importancia tiene más peso (multiplicada x 15) que Urgencia (multiplicada x 10)
      const priorityScore = (importance * 15) + (urgencyScore * 10);

      // CÁLCULO DE TIEMPO Y REPETICIONES
      let duration, reps;
      if (size === 1) { duration = 20; reps = 1; }
      else if (size === 2) { duration = 30; reps = 2; }
      else { duration = 45; reps = 4; }

      // Si es examen/trabajo largo, exige un poco más
      if ((type === 'examen' || type === 'trabajo') && size === 3) {
        reps = 5;
      }

      tasks.push({
        text: name,
        score: priorityScore,
        duration: duration,
        reps: reps,
        type: type
      });
      
      // Ordena de mayor puntaje matemático a menor
      tasks.sort((a, b) => b.score - a.score);
      
      // Limpiar formulario
      document.getElementById('task-name').value = '';
      updateCount();
      alert('Actividad procesada y añadida a la cola matemática.');
    }

    function startTasks() {
      if(tasks.length === 0) return alert('La lista está vacía.');
      document.getElementById('add-task-section').classList.add('hidden');
      document.getElementById('start-btn').classList.add('hidden');
      document.getElementById('task-display').style.display = 'block';
      showCurrentTask();
    }

    function showCurrentTask() {
      if(tasks.length === 0) {
        document.getElementById('task-display').style.display = 'none';
        document.getElementById('add-task-section').classList.remove('hidden');
        document.getElementById('start-btn').classList.remove('hidden');
        alert('¡Has completado todo por hoy!');
        return;
      }
      
      const current = tasks[0];
      document.getElementById('current-task-text').innerText = current.text;
      
      document.getElementById('task-meta-info').innerHTML = `
        <p>Configuración sugerida:</p>
        <p>• Temporizador: <span class="highlight">${current.duration} minutos</span> por sesión.</p>
        <p>• Repetir: <span class="highlight">${current.reps} veces</span> (Toma 5 min de descanso entre cada una).</p>
      `;
    }

    function completeTask() {
      tasks.shift();
      updateCount();
      showCurrentTask();
    }

    updateCount();
  </script>
</body>
</html>
