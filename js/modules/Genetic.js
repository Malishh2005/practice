import Physics from './Physics.js';
import FuzzyLogic from './FuzzyLogic.js';

export default class GeneticAlgorithm {
    constructor() {
        // --- НАЛАШТУВАННЯ ГА (Згідно Pelusi, 2011) ---
        this.populationSize = 20;     // Розмір популяції (20 варіантів контролера)
        this.mutationRate = 0.1;      // Шанс мутації (10%)
        this.generations = 0;         // Лічильник поколінь
        
        // Популяція: масив об'єктів { genes: [K_theta, K_dtheta, K_out], fitness: 0 }
        this.population = [];
        
        // Ініціалізація першого покоління випадковими числами
        this.initPopulation();
    }

    // 1. СТВОРЕННЯ ПОЧАТКОВОЇ ПОПУЛЯЦІЇ (Старт Еволюції)
    initPopulation() {
        this.population = [];
        for (let i = 0; i < this.populationSize; i++) {
            this.population.push({
                // Гени - це коефіцієнти, які ми шукаємо.
                // Генеруємо їх випадково в розумних межах.
                genes: [
                    Math.random() * 50,  // K_theta (наприклад, від 0 до 50)
                    Math.random() * 50,  // K_dtheta
                    Math.random() * 200  // K_out (сила, від 0 до 200)
                ],
                fitness: 0
            });
        }
        console.log("Популяція створена. Покоління 0.");
    }

    // 2. ФУНКЦІЯ ПРИСТОСОВАНОСТІ (Fitness Function)
    // Ми запускаємо симуляцію для одного набору генів і дивимося, як добре він працює.
    evaluate(genes) {
        // Створюємо "тестовий стенд"
        let physics = new Physics();
        let fuzzy = new FuzzyLogic();

        // Записуємо гени в контролер (переписуємо стандартні налаштування)
        fuzzy.K_theta = genes[0];
        fuzzy.K_dtheta = genes[1];
        fuzzy.K_out = genes[2];

        // Симулюємо 10 секунд (500 кроків по 0.02с)
        let totalError = 0;
        let isFallen = false;

        for (let t = 0; t < 500; t++) {
        let force = fuzzy.compute(physics.state);
        physics.update(force, 0.02);

        // --- СТАРА ФОРМУЛА ---
        // totalError += Math.abs(physics.state.theta) + 0.01 * Math.abs(physics.state.x);

        // --- НОВА ФОРМУЛА (З штрафом за силу) ---
        // 1. Штраф за кут (найголовніше)
        // 2. Штраф за позицію (щоб візок тримався центру)
        // 3. Штраф за СИЛУ (force * 0.001). Це змусить алгоритм шукати "м'які" рішення.
        
        totalError += Math.abs(physics.state.theta) 
                    + 0.1 * Math.abs(physics.state.x) 
                    + 0.001 * Math.abs(force); 

        if (Math.abs(physics.state.theta) > Math.PI / 4) {
            totalError += 1000; 
            isFallen = true;
            break;
        }
    }

        // Fitness має бути чим більше, тим краще. 
        // Тому беремо 1 / помилка.
        return 1 / (totalError + 0.0001);
    }

    // 3. ЕВОЛЮЦІЯ (Головний метод)
    evolve() {
        // А. ОЦІНКА ВСІХ (Testing)
        for (let individual of this.population) {
            individual.fitness = this.evaluate(individual.genes);
        }

        // Б. СОРТУВАННЯ (Survival of the fittest)
        // Сортуємо від кращих до гірших
        this.population.sort((a, b) => b.fitness - a.fitness);

        // Найкращий з цього покоління (Еліта)
        let best = this.population[0];
        console.log(`Покоління ${this.generations}: Найкращий Fitness = ${best.fitness.toFixed(4)}`);
        console.log(`Гени: [${best.genes.map(n => n.toFixed(2)).join(', ')}]`);

        // В. СТВОРЕННЯ НОВОГО ПОКОЛІННЯ
        let newPopulation = [];

        // 1. Елітизм: переносимо 2 найкращих без змін (щоб не втратити прогрес)
        newPopulation.push(JSON.parse(JSON.stringify(this.population[0])));
        newPopulation.push(JSON.parse(JSON.stringify(this.population[1])));

        // 2. Схрещування (Crossover) і Мутація
        while (newPopulation.length < this.populationSize) {
            // Вибираємо батьків (Турнірний відбір або просто кращих)
            let parentA = this.selectParent();
            let parentB = this.selectParent();

            // Народжуємо дитину (Crossover)
            let childGenes = this.crossover(parentA, parentB);

            // Мутуємо дитину (Mutation)
            this.mutate(childGenes);

            newPopulation.push({ genes: childGenes, fitness: 0 });
        }

        this.population = newPopulation;
        this.generations++;

        // Повертаємо найкращі гени, щоб показати їх на екрані
        return best.genes;
    }

    // Вибір батька (простий варіант: беремо випадкового з топ-50%)
    selectParent() {
        let index = Math.floor(Math.random() * (this.populationSize / 2));
        return this.population[index];
    }

    // Схрещування: беремо половину генів від тата, половину від мами
    crossover(parentA, parentB) {
        let child = [];
        for (let i = 0; i < 3; i++) {
            // 50% шанс взяти ген від А або від Б
            child.push(Math.random() > 0.5 ? parentA.genes[i] : parentB.genes[i]);
        }
        return child;
    }

    // Мутація: іноді випадково змінюємо ген
    mutate(genes) {
        for (let i = 0; i < 3; i++) {
            if (Math.random() < this.mutationRate) {
                // Додаємо випадкове число від -5 до +5
                genes[i] += (Math.random() - 0.5) * 10;
                
                // Слідкуємо, щоб не стали від'ємними (коефіцієнти > 0)
                if (genes[i] < 0) genes[i] = 0.1;
            }
        }
    }
}