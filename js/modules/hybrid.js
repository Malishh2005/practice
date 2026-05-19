import GeneticAlgorithm from './Genetic.js';
import PSO from './PSO.js';

export default class HybridOptimizer {
    constructor() {
        this.ga = new GeneticAlgorithm();
        this.pso = new PSO();
    }

    optimize() {
        console.log("=== СТАРТ ГІБРИДНОЇ ОПТИМІЗАЦІЇ ===");
        
        // Етап 1: Широкий пошук Генетичним алгоритмом (15 поколінь)
        console.log("Етап 1: Генетичний пошук...");
        this.ga.initPopulation();
        let bestGaGenes = null;
        for (let i = 0; i < 15; i++) {
            bestGaGenes = this.ga.evolve();
        }

        // Етап 2: Передача знань від ГА до Рою частинок
         console.log("Етап 2: Точне доведення Роєм частинок...");
         this.pso.initSwarm();

         for (let i = 0; i < this.pso.swarmSize; i++) {
            let inheritedIndividual = this.ga.population[i];
            
            // Передаємо координати
            this.pso.particles[i].position = [...inheritedIndividual.genes];
            this.pso.particles[i].bestPosition = [...inheritedIndividual.genes];
            
            // КРИТИЧНО ВАЖЛИВО: Передаємо пам'ять про успіх!
            this.pso.particles[i].fitness = inheritedIndividual.fitness;
            this.pso.particles[i].bestFitness = inheritedIndividual.fitness;
         }

         // Щоб Рій знав, куди летіти, оновлюємо глобальний рекорд одразу:
         this.pso.globalBest.fitness = this.ga.population[0].fitness;
         this.pso.globalBest.position = [...this.ga.population[0].genes];

        // Запускаємо Рій (ще 15 ітерацій)
        let bestHybridParams = null;
        for (let i = 0; i < 15; i++) {
            bestHybridParams = this.pso.update();
        }

        console.log("=== ГІБРИДНУ ОПТИМІЗАЦІЮ ЗАВЕРШЕНО ===");
        return {
            params: bestHybridParams,
            fitness: this.pso.globalBest.fitness
        };
    }
}