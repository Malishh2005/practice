import Physics from './Physics.js';
import FuzzyLogic from './FuzzyLogic.js';

export default class PSO {
    constructor() {
        // --- НАЛАШТУВАННЯ PSO (Згідно Boubertakh, 2013) ---
        this.swarmSize = 20;    // Кількість частинок
        this.iterations = 0;    
        
        // Коефіцієнти (стандартні для PSO) [cite: 814]
        this.w = 0.7;           // Інерція (Inertia weight) - як сильно частинка хоче летіти далі
        this.c1 = 1.5;          // Когнітивний коефіцієнт (тяга до свого найкращого результату)
        this.c2 = 1.5;          // Соціальний коефіцієнт (тяга до найкращого результату зграї)

        this.particles = [];
        this.globalBest = { position: null, fitness: -Infinity }; // gBest

        this.initSwarm();
    }

    // 1. Ініціалізація рою
    initSwarm() {
        this.particles = [];
        this.globalBest = { position: null, fitness: -Infinity };

        for (let i = 0; i < this.swarmSize; i++) {
            // Випадкова позиція (наші K-коефіцієнти)
            let position = [
                Math.random() * 50,    // K_theta
                Math.random() * 50,    // K_dtheta
                Math.random() * 150,   // K_out
                (Math.random() - 0.5) * 0.2, // K_x (теперь может быть отрицательным!)
                (Math.random() - 0.5) * 0.2  // K_v (теперь может быть отрицательным!)
            ];

            // Частинка
            let particle = {
                position: position,
                velocity: [0, 0, 0, 0, 0], // Початкова швидкість нульова
                bestPosition: [...position], // pBest
                bestFitness: -Infinity,
                fitness: 0
            };

            this.particles.push(particle);
        }
        console.log("Рій частинок створено.");
    }

    // 2. Оцінка (Така сама, як в Genetic.js)
    evaluate(params) {
        let physics = new Physics();
        let fuzzy = new FuzzyLogic();

        fuzzy.K_theta = params[0];
        fuzzy.K_dtheta = params[1];
        fuzzy.K_out = params[2];
        fuzzy.K_x = params[3];
        fuzzy.K_v = params[4];

        let totalError = 0;
        let frameCount = 0;
        let lastAutoForce = 0;
        
        // Симуляция 10 секунд
        for (let t = 0; t < 500; t++) {
            frameCount++;
            
            // Имитация задержки процессора и шума датчика во время ТРЕНИРОВКИ
            if (frameCount % 4 === 0) {
                let perceivedState = {
                    x: physics.state.x,
                    v: physics.state.v,
                    theta: physics.state.theta + (Math.random() - 0.5) * 0.05,
                    omega: physics.state.omega + (Math.random() - 0.5) * 0.1
                };
                lastAutoForce = fuzzy.compute(perceivedState);
            }

            // Добавляем ветер во время ТРЕНИРОВКИ
            let windForce = (Math.random() - 0.5) * 8; 
            
            physics.update(lastAutoForce + windForce, 0.02);

            // Штрафы
            totalError += Math.abs(physics.state.theta) 
                        + 0.1 * Math.abs(physics.state.x) 
                        + 0.001 * Math.abs(lastAutoForce);

            // Если упал - огромный штраф и прекращаем тест
            if (Math.abs(physics.state.theta) > Math.PI / 4) {
                totalError += 10000; // Увеличили штраф за падение
                break;
            }
        }

        return 1 / (totalError + 0.0001);
    }

    // 3. Оновлення рою (Один крок еволюції)
    update() {
        // А. Оцінюємо кожну частинку
        for (let p of this.particles) {
            p.fitness = this.evaluate(p.position);

            // Оновлюємо персональний рекорд (pBest) [cite: 814]
            if (p.fitness > p.bestFitness) {
                p.bestFitness = p.fitness;
                p.bestPosition = [...p.position];
            }

            // Оновлюємо глобальний рекорд (gBest)
            if (p.fitness > this.globalBest.fitness) {
                this.globalBest.fitness = p.fitness;
                this.globalBest.position = [...p.position];
            }
        }

        // Б. Рухаємо частинки (Формули 9 і 10 з Boubertakh, 2013)
        for (let p of this.particles) {
            for (let i = 0; i < 3; i++) {
                let r1 = Math.random();
                let r2 = Math.random();

                // Оновлення швидкості (v)
                // v_new = w*v + c1*r1*(pBest - x) + c2*r2*(gBest - x)
                p.velocity[i] = this.w * p.velocity[i] 
                              + this.c1 * r1 * (p.bestPosition[i] - p.position[i])
                              + this.c2 * r2 * (this.globalBest.position[i] - p.position[i]);

                // Оновлення позиції (x)
                p.position[i] += p.velocity[i];

                // Обмеження, щоб коефіцієнти не стали від'ємними
                if (p.position[i] < 0) p.position[i] = 0.1;
            }
        }

        this.iterations++;
        return this.globalBest.position;
    }
}