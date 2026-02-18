import Physics from './modules/Physics.js';
import View from './modules/View.js';
import FuzzyLogic from './modules/FuzzyLogic.js';
import GeneticAlgorithm from './modules/Genetic.js';
import PSO from './modules/PSO.js';

// --- ІНІЦІАЛІЗАЦІЯ ---
const physics = new Physics();
const view = new View('simCanvas');
const fuzzy = new FuzzyLogic();
const ga = new GeneticAlgorithm();
const pso = new PSO(); 

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

            // UI
            statusBox.innerHTML = `<b>PSO Готово!</b><br>K_a: ${bestParams[0].toFixed(2)}, K_s: ${bestParams[1].toFixed(2)}, F: ${bestParams[2].toFixed(2)}<br>K_x: ${bestParams[3].toFixed(3)}, K_v: ${bestParams[4].toFixed(3)}`;
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

            // 4. Оновлення інтерфейсу
            statusBox.innerHTML = `<b>GA Готово!</b><br>K_a: ${bestGenes[0].toFixed(2)}, K_s: ${bestGenes[1].toFixed(2)}, F: ${bestGenes[2].toFixed(2)}<br>K_x: ${bestGenes[3].toFixed(3)}, K_v: ${bestGenes[4].toFixed(3)}`;
            statusBox.style.background = "#d4edda"; // Зелений
            statusBox.style.color = "#155724";
            
            console.log("Нові параметри GA застосовано до контролера!");
            
            // 5. Автоматично вмикаємо режим Fuzzy і перезапускаємо
            selectMode.value = 'fuzzy';
            restart(); 

        }, 50); // Невелика затримка для рендерингу UI
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