import Physics from './modules/Physics.js';
import View from './modules/View.js';
import FuzzyLogic from './modules/FuzzyLogic.js';
import GeneticAlgorithm from './modules/Genetic.js';

// --- ІНІЦІАЛІЗАЦІЯ ---
const physics = new Physics();
const view = new View('simCanvas');
const fuzzy = new FuzzyLogic();
const ga = new GeneticAlgorithm();

// Змінні керування
let isPaused = false;
let manualForce = 0;
const FORCE_STEP = 20; // Сила поштовху при натисканні клавіш

// Елементи UI (статистика)
const uiTime = document.getElementById('timeDisplay'); 
const uiAngle = document.getElementById('angleDisplay'); 
const uiPos = document.getElementById('posDisplay');

// Елементи керування
const selectMode = document.getElementById('controlMode'); // Вибір режиму
const btnStart = document.getElementById('btnStart');
const btnPause = document.getElementById('btnPause');
const btnTrainGA = document.getElementById('btnTrainGA');
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
window.applyForce = (force) => {
    manualForce = force;
    setTimeout(() => manualForce = 0, 200); // Штовхнули і відпустили через 0.2с
};

// --- ЛОГІКА ГЕНЕТИЧНОГО АЛГОРИТМУ ---
if (btnTrainGA) {
    btnTrainGA.addEventListener('click', () => {
        // 1. Візуальна індикація початку
        statusBox.innerText = "Тренування... (Зачекайте)";
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
            statusBox.innerHTML = `<b>Готово!</b> Кращі параметри:<br> K_angle: ${bestGenes[0].toFixed(2)}, K_speed: ${bestGenes[1].toFixed(2)}, Force: ${bestGenes[2].toFixed(2)}`;
            statusBox.style.background = "#d4edda"; // Зелений
            statusBox.style.color = "#155724";
            
            console.log("Нові параметри застосовано до контролера!");
            
            // 5. Автоматично вмикаємо режим Fuzzy і перезапускаємо
            selectMode.value = 'fuzzy';
            restart(); 

        }, 50); // Невелика затримка для рендерингу UI
    });
}

// --- ГОЛОВНИЙ ЦИКЛ СИМУЛЯЦІЇ ---
function loop() {
    if (!isPaused) {
        let force = 0;

        // Перевіряємо, який режим вибрав користувач
        const mode = selectMode.value; // 'manual' або 'fuzzy'

        if (mode === 'manual') {
            force = manualForce;
        } else if (mode === 'fuzzy') {
            // АВТОМАТИЧНЕ КЕРУВАННЯ
            // 1. Контролер отримує стан системи
            // 2. Обчислює потрібну силу
            let autoForce = fuzzy.compute(physics.state);
            
            // Додаємо ручне збурення (якщо ми натиснули кнопку "Штовхнути")
            force = autoForce + manualForce;
        }

        // Оновлення фізики (крок 0.02с = 50 FPS)
        const dt = 0.02; 
        const state = physics.update(force, dt);
        totalTime += dt;

        // Малювання
        view.draw(state);

        // Оновлення статистики на екрані
        updateUI(state);
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