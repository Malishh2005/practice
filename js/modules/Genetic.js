import Physics from './Physics.js';
import FuzzyLogic from './FuzzyLogic.js';

export default class GeneticAlgorithm {
    constructor() {
        // --- НАЛАШТУВАННЯ ГА ---
        this.populationSize = 20;     // Розмір популяції
        this.mutationRate = 0.1;      // Шанс мутації
        this.generations = 0;         // Лічильник поколінь
        
        this.population = [];
        this.initPopulation();
    }

    // 1. СТВОРЕННЯ ПОЧАТКОВОЇ ПОПУЛЯЦІЇ
    initPopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push({
                genes: [
                    Math.random() * 50,          // K_theta
                    Math.random() * 50,          // K_dtheta
                    Math.random() * 150,         // K_out 
                    (Math.random() - 0.5) * 0.2, // K_x (Тепер може бути від'ємним!)
                    (Math.random() - 0.5) * 0.2  // K_v (Тепер може бути від'ємним!)
                ],
                fitness: 0
            });
        }
        console.log("Популяція створена. Покоління 0.");
    }

    // 2. ФУНКЦІЯ ПРИСТОСОВАНОСТІ (ТРЕНУВАННЯ В РЕАЛІСТИЧНИХ УМОВАХ)
    evaluate(genes) {
        let physics = new Physics();
        let fuzzy = new FuzzyLogic();

        fuzzy.K_theta = genes[0];
        fuzzy.K_dtheta = genes[1];
        fuzzy.K_out = genes[2];
        fuzzy.K_x = genes[3]; 
        fuzzy.K_v = genes[4]; 

        let totalError = 0;
        let frameCount = 0;
        let lastAutoForce = 0;

        // Симулюємо 10 секунд (500 кроків)
        for (let t = 0; t < 500; t++) {
            frameCount++;

            // Імітація затримки та шуму сенсорів під час тренування
            if (frameCount % 4 === 0) {
                let perceivedState = {
                    x: physics.state.x,
                    v: physics.state.v,
                    theta: physics.state.theta + (Math.random() - 0.5) * 0.05,
                    omega: physics.state.omega + (Math.random() - 0.5) * 0.1
                };
                lastAutoForce = fuzzy.compute(perceivedState);
            }

            // Додаємо вітер під час тренування
            let windForce = (Math.random() - 0.5) * 8; 
            
            physics.update(lastAutoForce + windForce, 0.02);

            // Штрафи за відхилення
            totalError += Math.abs(physics.state.theta) 
                        + 0.1 * Math.abs(physics.state.x) 
                        + 0.001 * Math.abs(lastAutoForce); 

            // Якщо впав - величезний штраф і зупиняємо цей тест
            if (Math.abs(physics.state.theta) > Math.PI / 4) {
                totalError += 10000; 
                break;
            }
        }

        return 1 / (totalError + 0.0001);
    }

    // 3. ЕВОЛЮЦІЯ
    evolve() {
        // Оцінка
        for (let individual of this.population) {
            individual.fitness = this.evaluate(individual.genes);
        }

        // Сортування (від кращих до гірших)
        this.population.sort((a, b) => b.fitness - a.fitness);

        let best = this.population[0];
        console.log(`Покоління ${this.generations}: Найкращий Fitness = ${best.fitness.toFixed(4)}`);
        
        let newPopulation = [];

        // Елітизм: зберігаємо топ-2 без змін
        newPopulation.push(JSON.parse(JSON.stringify(this.population[0])));
        newPopulation.push(JSON.parse(JSON.stringify(this.population[1])));

        // Схрещування і мутація для решти
        while (newPopulation.length < this.populationSize) {
            let parentA = this.selectParent();
            let parentB = this.selectParent();
            
            let childGenes = this.crossover(parentA, parentB);
            this.mutate(childGenes);
            
            newPopulation.push({ genes: childGenes, fitness: 0 });
        }

        this.population = newPopulation;
        this.generations++;

        return best.genes;
    }

    // Вибір батька
    selectParent() {
        let index = Math.floor(Math.random() * (this.populationSize / 2));
        return this.population[index];
    }

    // Схрещування (ТЕПЕР ДЛЯ 5 ГЕНІВ)
    crossover(parentA, parentB) {
        let child = [];
        for (let i = 0; i < 5; i++) { 
            child.push(Math.random() > 0.5 ? parentA.genes[i] : parentB.genes[i]);
        }
        return child;
    }

    // Мутація (ТЕПЕР ДЛЯ 5 ГЕНІВ З ПРАВИЛЬНИМИ ЗНАКАМИ)
    mutate(genes) {
        for (let i = 0; i < 5; i++) { 
            if (Math.random() < this.mutationRate) {
                genes[i] += (Math.random() - 0.5) * 10;
                
                // Перевірка на невід'ємність ТІЛЬКИ для перших 3 генів (кут, швидкість кута, сила)
                // 4-й (K_x) та 5-й (K_v) гени МОЖУТЬ і ПОВИННІ бути від'ємними за потреби
                if (i < 3 && genes[i] < 0) {
                    genes[i] = 0.1;
                }
            }
        }
    }
}