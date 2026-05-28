import Physics from './modules/Physics.js';
import View from './modules/View.js';
import FuzzyLogic from './modules/FuzzyLogic.js';
import GeneticAlgorithm from './modules/Genetic.js';
import PSO from './modules/PSO.js';
import HybridOptimizer from './modules/hybrid.js';

// --- ІНІЦІАЛІЗАЦІЯ ---
const physics = new Physics();
const view = new View('simCanvas');
const fuzzy = new FuzzyLogic();
const ga = new GeneticAlgorithm();
const pso = new PSO(); 
const hybrid = new HybridOptimizer();
const btnTrainHybrid = document.getElementById('btnTrainHybrid');

// Змінні керування
let isPaused = false;
let manualForce = 0;
const FORCE_STEP = 20; // Сила поштовху при натисканні клавіш

// Елементи UI (статистика)
const uiTime = document.getElementById('timeDisplay'); 
const uiAngle = document.getElementById('angleDisplay'); 
const uiPos = document.getElementById('posDisplay');

// Елементи керування
const selectMode = document.getElementById('controlMode'); // Вибір режиму керування
const selectIntegrator = document.getElementById('integratorSelect'); // Вибір методу фізики
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnTrainGA = document.getElementById('btnTrainGA');
const btnTrainPSO = document.getElementById('btnTrainPSO');
const statusBox = document.getElementById('trainingStatus');

let totalTime = 0;

// --- ОБРОБКА КЛАВІАТУРИ ---
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') manualForce = FORCE_STEP;
    if (e.key === 'ArrowLeft') manualForce = -FORCE_STEP;
    if (e.key === 'r' || e.key === 'R') restart();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') manualForce = 0;
});

// --- ОБРОБКА КНОПОК ---
btnStart.addEventListener('click', restart);
btnPause.addEventListener('click', () => { isPaused = !isPaused; });

// Кнопки "Штовхнути" (для тестування стійкості)
// Робимо глобальною функцією, щоб працювало через onclick в HTML
window.applyForce = (force) => {
    manualForce = force;
    setTimeout(() => manualForce = 0, 200); // Штовхнули і відпустили через 0.2с
};

// --- ВИБІР МЕТОДУ ІНТЕГРУВАННЯ (Euler vs RK4) ---
if (selectIntegrator) {
    // Встановлюємо значення за замовчуванням
    selectIntegrator.value = 'rk4'; 
    physics.integrator = 'rk4';

    selectIntegrator.addEventListener('change', () => {
        physics.integrator = selectIntegrator.value;
        console.log(`Метод інтегрування змінено на: ${physics.integrator}`);
        // Можна розкоментувати, якщо хочете рестарт при зміні методу
        // restart(); 
    });
}

// --- ЛОГІКА PSO (РІЙ ЧАСТИНОК) ---
if (btnTrainPSO) {
    btnTrainPSO.addEventListener('click', () => {
        statusBox.innerText = "Тренування PSO... (Зачекайте)";
        statusBox.style.background = "#cce5ff"; // Блакитний колір
        statusBox.style.color = "#004085";

        setTimeout(() => {
            let bestParams = null;
            const iterations = 30; // PSO зазвичай збігається швидше

            console.log("Початок оптимізації Роєм Частинок...");
            
            // Скидаємо рій перед новим навчанням
            pso.initSwarm();

            for(let i = 0; i < iterations; i++) {
                bestParams = pso.update();
            }

            // Застосування результатів
            fuzzy.K_theta = bestParams[0];
            fuzzy.K_dtheta = bestParams[1];
            fuzzy.K_out = bestParams[2];
            fuzzy.K_x = bestParams[3]; // ДОДАТИ ЦЕ
            fuzzy.K_v = bestParams[4];
            // UI
            statusBox.innerHTML = `<b>PSO Готово!</b><br>K_a: ${bestParams[0].toFixed(2)}, K_s: ${bestParams[1].toFixed(2)}, F: ${bestParams[2].toFixed(2)}<br>K_x: ${bestParams[3].toFixed(3)}, K_v: ${bestParams[4].toFixed(3)}`;
            // ЗАПИС У ТАБЛИЦЮ:
            let bestFitness = pso.globalBest.fitness; 
            logToTable('Рій Частинок (PSO)', bestFitness, bestParams);
            statusBox.style.background = "#d4edda";
            statusBox.style.color = "#155724";
            
            console.log("Параметри PSO застосовано!");
            
            // Автоматично вмикаємо режим Fuzzy і перезапускаємо
            selectMode.value = 'fuzzy';
            restart(); 

        }, 50);
    });
}

// --- ЛОГІКА ГЕНЕТИЧНОГО АЛГОРИТМУ ---
if (btnTrainGA) {
    btnTrainGA.addEventListener('click', () => {
        // 1. Візуальна індикація початку
        statusBox.innerText = "Тренування GA... (Зачекайте)";
        statusBox.style.background = "#fff3cd"; // Жовтий
        statusBox.style.color = "#856404";

        // Використовуємо setTimeout, щоб браузер встиг оновити текст перед важкими обчисленнями
        setTimeout(() => {
            let bestGenes = null;
            const generations = 20; // Кількість поколінь

            console.log("Початок генетичної оптимізації...");
            
            // 2. Запуск еволюції
            // Ми проганяємо цикл еволюції 20 разів підряд
            for(let i = 0; i < generations; i++) {
                bestGenes = ga.evolve();
            }

            // 3. Застосування результатів
            // ГА знайшов найкращі коефіцієнти. Передаємо їх у наш робочий контролер.
            fuzzy.K_theta = bestGenes[0];
            fuzzy.K_dtheta = bestGenes[1];
            fuzzy.K_out = bestGenes[2];
            fuzzy.K_x = bestGenes[3]; // ДОДАТИ ЦЕ
            fuzzy.K_v = bestGenes[4];
            // 4. Оновлення інтерфейсу
            statusBox.innerHTML = `<b>GA Готово!</b><br>K_a: ${bestGenes[0].toFixed(2)}, K_s: ${bestGenes[1].toFixed(2)}, F: ${bestGenes[2].toFixed(2)}<br>K_x: ${bestGenes[3].toFixed(3)}, K_v: ${bestGenes[4].toFixed(3)}`;
            // ЗАПИС У ТАБЛИЦЮ:
            let bestFitness = ga.population[0].fitness; // Отримуємо оцінку кращого рішення
            logToTable('Генетичний Алгоритм (GA)', bestFitness, bestGenes);
            statusBox.style.background = "#d4edda"; // Зелений
            statusBox.style.color = "#155724";
            
            console.log("Нові параметри GA застосовано до контролера!");
            
            // 5. Автоматично вмикаємо режим Fuzzy і перезапускаємо
            selectMode.value = 'fuzzy';
            restart(); 

        }, 50); // Невелика затримка для рендерингу UI
    });
}

// --- ЛОГІКА ГІБРИДУ (GA + PSO) ---
if (btnTrainHybrid) {
    btnTrainHybrid.addEventListener('click', () => {
        statusBox.innerText = "Тренування Гібриду (GA -> PSO)... (Зачекайте)";
        statusBox.style.background = "#e0e7ff"; // Світло-фіолетовий
        statusBox.style.color = "#3730a3";

        setTimeout(() => {
            // Запускаємо гібридний оптимізатор
            const result = hybrid.optimize();
            const bestParams = result.params;
            const bestFitness = result.fitness;

            // Застосовуємо знайдені параметри до контролера
            fuzzy.K_theta = bestParams[0];
            fuzzy.K_dtheta = bestParams[1];
            fuzzy.K_out = bestParams[2];
            fuzzy.K_x = bestParams[3];
            fuzzy.K_v = bestParams[4];

            // UI
            statusBox.innerHTML = `<b>Гібрид Готово!</b><br>K_a: ${bestParams[0].toFixed(2)}, K_s: ${bestParams[1].toFixed(2)}, F: ${bestParams[2].toFixed(2)}<br>K_x: ${bestParams[3].toFixed(3)}, K_v: ${bestParams[4].toFixed(3)}`;
            
            // ЗАПИС У ТАБЛИЦЮ
            logToTable('Гібрид (GA+PSO)', bestFitness, bestParams);
            statusBox.style.background = "#d4edda";
            statusBox.style.color = "#155724";
            
            selectMode.value = 'fuzzy';
            restart(); 

        }, 50);
    });
}

// --- ГОЛОВНИЙ ЦИКЛ СИМУЛЯЦІЇ ---
// Додаємо змінні для імітації затримки
let frameCount = 0;
let lastAutoForce = 0;

function loop() {
    if (!isPaused) {
        let force = 0;
        frameCount++; // Рахуємо кадри симуляції

        const mode = selectMode.value;

        if (mode === 'manual') {
            force = manualForce;
        } else if (mode === 'fuzzy') {
            
            // 1. ІМІТАЦІЯ ЗАТРИМКИ МІКРОКОНТРОЛЕРА
            // Контролер "думає" і оновлює силу лише кожен 4-й кадр
            if (frameCount % 4 === 0) {
                
                // 2. ІМІТАЦІЯ ШУМУ ДАТЧИКА (Сенсор бреше на ±1.5 градуса)
                let sensorNoiseTheta = (Math.random() - 0.5) * 0.05; // Шум кута
                let sensorNoiseOmega = (Math.random() - 0.5) * 0.1;  // Шум швидкості обертання
                
                // Створюємо "брудний" стан, який бачить контролер
                let perceivedState = {
                    x: physics.state.x,
                    v: physics.state.v,
                    theta: physics.state.theta + sensorNoiseTheta,
                    omega: physics.state.omega + sensorNoiseOmega
                };

                // Контролер обчислює силу на основі хибних даних
                lastAutoForce = fuzzy.compute(perceivedState);
            }
            
            // 3. ФІЗИЧНІ ЗБУРЕННЯ (Сильніший вітер)
            // Випадкова фізична сила на візок ±10 Ньютонів
            let windForce = (Math.random() - 0.5) * 8; 

            // Збираємо все разом
            force = lastAutoForce + manualForce + windForce;
        }

        // Оновлення фізики (крок 0.02с)
        const dt = 0.02; 
        physics.update(force, dt);
        totalTime += dt;

        view.draw(physics.state);
        updateUI(physics.state);
    }
    requestAnimationFrame(loop);
}

// Функція оновлення тексту в HTML
function updateUI(state) {
    // Переводимо радіани в градуси
    const angleDeg = (state.theta * 180 / Math.PI).toFixed(1);
    
    if(uiTime) uiTime.innerText = totalTime.toFixed(2);
    if(uiAngle) uiAngle.innerText = angleDeg;
    if(uiPos) uiPos.innerText = state.x.toFixed(2);
}

// Функція повного скидання
function restart() {
    physics.reset();
    totalTime = 0;
    isPaused = false;
    // Скидаємо графіки, якщо вони будуть додані пізніше
}

// Запуск циклу
loop();

// ==========================================
// ЛОГІКА ВКЛАДОК ТА ТАБЛИЦІ РЕЗУЛЬТАТІВ
// ==========================================

const tabSimBtn = document.getElementById('tabSimBtn');
const tabResBtn = document.getElementById('tabResBtn');
const tabBenchBtn = document.getElementById('tabBenchBtn');

const tabSimulation = document.getElementById('tabSimulation');
const tabResults = document.getElementById('tabResults');
const tabBenchmark = document.getElementById('tabBenchmark');

// Універсальна функція перемикання
function setActiveTab(activeBtn, activePane) {
    [tabSimBtn, tabResBtn, tabBenchBtn].forEach(btn => btn.classList.remove('active'));
    [tabSimulation, tabResults, tabBenchmark].forEach(pane => pane.classList.remove('active'));
    
    activeBtn.classList.add('active');
    activePane.classList.add('active');
}

// Слухачі кліків для вкладок
tabSimBtn.addEventListener('click', () => setActiveTab(tabSimBtn, tabSimulation));
tabResBtn.addEventListener('click', () => setActiveTab(tabResBtn, tabResults));
tabBenchBtn.addEventListener('click', () => setActiveTab(tabBenchBtn, tabBenchmark));

// Функція запису результатів у таблицю (для 2-ї вкладки)
function logToTable(optimizerName, fitness, genes) {
    const tbody = document.getElementById('resultsBody');
    const integratorName = selectIntegrator.value === 'rk4' ? 'Рунге-Кутта (RK4)' : 'Ейлер';
    const timeStr = new Date().toLocaleTimeString();
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td>${timeStr}</td>
        <td><b>${optimizerName}</b></td>
        <td>${integratorName}</td>
        <td style="color: green; font-weight: bold;">${fitness.toFixed(4)}</td>
        <td>${genes[0].toFixed(2)}</td>
        <td>${genes[1].toFixed(2)}</td>
        <td>${genes[2].toFixed(2)}</td>
        <td>${genes[3].toFixed(4)}</td>
        <td>${genes[4].toFixed(4)}</td>
    `;
    tbody.insertBefore(row, tbody.firstChild);
}

// Експорт таблиці в CSV
document.getElementById('btnExportCSV').addEventListener('click', () => {
    let csvContent = "data:text/csv;charset=utf-8,%EF%BB%BF";
    csvContent += "Time,Optimizer,Physics Method,Fitness,K_theta,K_dtheta,K_out,K_x,K_v\n";
    
    const rows = document.querySelectorAll("#resultsTable tbody tr");
    rows.forEach(row => {
        let rowData = [];
        row.querySelectorAll("td").forEach(cell => {
            rowData.push(cell.innerText.replace(/,/g, ".")); 
        });
        csvContent += rowData.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "optimization_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// ==========================================
// ЛОГІКА ТРЕТЬОЇ ВКЛАДКИ: КОМПЛЕКСНИЙ БЕНЧМАРК
// ==========================================

const btnRunBenchmark = document.getElementById('btnRunBenchmark');
const benchBody = document.getElementById('benchmarkBody');
const benchStatus = document.getElementById('benchStatus');
let benchmarkChartInstance = null; 

function calculateStdDev(array, mean) {
    const variance = array.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / array.length;
    return Math.sqrt(variance);
}

if (btnRunBenchmark) {
    btnRunBenchmark.addEventListener('click', async () => {
        btnRunBenchmark.disabled = true;
        btnRunBenchmark.style.opacity = "0.5";
        
        const RUNS_COUNT = 20;
        const gaResults = [];
        const psoResults = [];
        const hybridResults = [];

        // ЕТАП 1: ТЕСТ ГЕНЕТИКИ
        benchStatus.innerHTML = "⏳ <b>Етап 1/3:</b> Тестування Генетичного алгоритму... <br>Прогрес: обчислюються 20 еволюційних циклів.";
        benchStatus.style.color = "#856404";
        benchStatus.style.background = "#fff3cd";
        await new Promise(resolve => setTimeout(resolve, 100)); 

        for (let r = 0; r < RUNS_COUNT; r++) {
            ga.initPopulation();
            for (let g = 0; g < 20; g++) { ga.evolve(); }
            gaResults.push(ga.population[0].fitness);
        }

        // ЕТАП 2: ТЕСТ PSO
        benchStatus.innerHTML = "⏳ <b>Етап 2/3:</b> Тестування Методу рою частинок... <br>Прогрес: обчислюються 20 запусків зграї.";
        benchStatus.style.color = "#004085";
        benchStatus.style.background = "#cce5ff";
        await new Promise(resolve => setTimeout(resolve, 100));

        for (let r = 0; r < RUNS_COUNT; r++) {
            pso.initSwarm();
            for (let i = 0; i < 30; i++) { pso.update(); }
            psoResults.push(pso.globalBest.fitness);
        }

        // ЕТАП 3: ТЕСТ ГІБРИДУ
        benchStatus.innerHTML = "⏳ <b>Етап 3/3:</b> Тестування Гібридного алгоритму (GA + PSO)... <br>Прогрес: обчислюються 20 комплексних каскадів навчання.";
        benchStatus.style.color = "#3730a3";
        benchStatus.style.background = "#e0e7ff";
        await new Promise(resolve => setTimeout(resolve, 100));

        for (let r = 0; r < RUNS_COUNT; r++) {
            const res = hybrid.optimize();
            hybridResults.push(res.fitness);
        }

        // ОБРОБКА РЕЗУЛЬТАТІВ
        benchStatus.innerHTML = "🎉 <b>Аналіз завершено!</b> Статистична матриця сформована, графік побудовано успішно.";
        benchStatus.style.color = "#155724";
        benchStatus.style.background = "#d4edda";

        const dataset = [
            { name: 'Генетичний Алгоритм (GA)', data: gaResults },
            { name: 'Рій Частинок (PSO)', data: psoResults },
            { name: 'Гібрид (GA+PSO)', data: hybridResults }
        ];

        const stats = dataset.map(item => {
            const max = Math.max(...item.data);
            const min = Math.min(...item.data);
            const sum = item.data.reduce((a, b) => a + b, 0);
            const mean = sum / item.data.length;
            const stdDev = calculateStdDev(item.data, mean);
            return { name: item.name, mean, max, min, stdDev };
        });

        benchBody.innerHTML = '';
        stats.forEach(s => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><b>${s.name}</b></td>
                <td style="color: #4361ee; font-weight: bold; font-size: 1.1em;">${s.mean.toFixed(4)}</td>
                <td style="color: #10b981; font-weight: 500;">${s.max.toFixed(4)}</td>
                <td style="color: #ef4444;">${s.min.toFixed(4)}</td>
                <td style="font-family: monospace;">${s.stdDev.toFixed(4)}</td>
            `;
            benchBody.appendChild(row);
        });

        drawBenchmarkChart(stats);

        btnRunBenchmark.disabled = false;
        btnRunBenchmark.style.opacity = "1";
    });
}

function drawBenchmarkChart(stats) {
    const ctx = document.getElementById('benchmarkChart').getContext('2d');
    if (benchmarkChartInstance) {
        benchmarkChartInstance.destroy();
    }
    benchmarkChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: stats.map(s => s.name),
            datasets: [
                {
                    label: 'Середня ефективність (Mean)',
                    data: stats.map(s => s.mean),
                    backgroundColor: ['rgba(245, 158, 11, 0.7)', 'rgba(16, 185, 129, 0.7)', 'rgba(139, 92, 246, 0.7)'],
                    borderColor: ['#d97706', '#059669', '#7c3aed'],
                    borderWidth: 1.5,
                    borderRadius: 6
                },
                {
                    label: 'Абсолютний пік (Max)',
                    data: stats.map(s => s.max),
                    backgroundColor: ['rgba(245, 158, 11, 0.2)', 'rgba(16, 185, 129, 0.2)', 'rgba(139, 92, 246, 0.2)'],
                    borderColor: ['#d97706', '#059669', '#7c3aed'],
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                title: { display: true, text: 'Порівняльний аналіз математичного очікування та рекордів' }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Значення Fitness' }
                }
            }
        }
    });
}

// ==========================================
// ТЕСТ ДЛЯ ДИПЛОМУ: ВЕРИФІКАЦІЯ МЕТОДУ RK4
// ==========================================
// ==========================================
// ТЕСТ ДЛЯ ДИПЛОМУ: ВЕРИФІКАЦІЯ МЕТОДУ RK4
// ==========================================
function runPhysicsVerification() {
    console.log("=== СТАРТ ВЕРИФІКАЦІЇ РУНГЕ-КУТТИ (RK4) ===");
    
    const testPhysics = new Physics();
    
    // Ідеальні умови
    testPhysics.M = 1000000; // Нерухомий візок
    testPhysics.b1 = 0;      // Немає тертя
    testPhysics.b2 = 0;      
    
    // ТИМЧАСОВО ПЕРЕВЕРТАЄМО ГРАВІТАЦІЮ, щоб маятник звисав вниз
    testPhysics.g = -9.8;    

    // Початкові умови
    testPhysics.state.theta = 0.1;
    testPhysics.state.omega = 0;
    testPhysics.state.x = 0;
    testPhysics.state.v = 0;
    testPhysics.integrator = 'rk4';

    let t = 0;
    const dt = 0.02;
    // Беремо модуль гравітації для формули частоти
    const w = Math.sqrt(Math.abs(testPhysics.g) / testPhysics.l); 

    console.log("Час (с) | RK4 (рад) | Точна формула | Похибка");
    console.log("--------------------------------------------------");

    for (let i = 0; i <= 100; i++) {
        let exactTheta = 0.1 * Math.cos(w * t);
        let error = Math.abs(testPhysics.state.theta - exactTheta);

        if (i % 10 === 0) {
            console.log(`${t.toFixed(1)}     | ${testPhysics.state.theta.toFixed(5)}   | ${exactTheta.toFixed(5)}     | ${error.toExponential(2)}`);
        }

        testPhysics.update(0, dt);
        t += dt;
    }
    console.log("=== ВЕРИФІКАЦІЮ ЗАВЕРШЕНО ===");
}

setTimeout(runPhysicsVerification, 2000);