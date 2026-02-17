export default class Physics {
    constructor() {
        // Параметри системи (Inverted Pendulum Parameters)
        this.M = 1.0;     // Маса візка (kg)
        this.m = 0.1;     // Маса маятника (kg)
        this.l = 0.5;     // Довжина стержня (m)
        this.g = 9.8;     // Гравітація (m/s^2)

        // Коефіцієнти тертя
        this.b1 = 0.1;    // Тертя маятника
        this.b2 = 5.0;    // Тертя візка

        // Початковий стан
        this.state = {
            x: 0,         // Позиція
            v: 0,         // Швидкість
            theta: 0.1,   // Кут (трохи нахилений, щоб почав падати)
            omega: 0      // Кутова швидкість
        };
    }

    reset() {
        this.state = { 
            x: 0, 
            v: 0, 
            theta: (Math.random() - 0.5) * 0.2, 
            omega: 0 
        };
    }

    update(force, dt) {
        // Розпаковка змінних
        let { x, v, theta, omega } = this.state;
        const { M, m, l, g, b1, b2 } = this;
        const u = force; 

        const sin = Math.sin(theta);
        const cos = Math.cos(theta);
        const omega2 = omega * omega;

        // --- Рівняння руху ---
        
        // Знаменник
        const commonDenom = (M + m) * l - m * l * cos * cos;

        // Прискорення візка (a_x)
        const numerX = (u + m * l * omega2 * sin - b2 * v) * l - (m * g * l * sin - b1 * omega) * cos;
        const a_x = numerX / commonDenom;

        // Кутове прискорення (a_theta)
        const numerTheta = (m * g * l * sin - b1 * omega) * (M + m) - (u + m * l * omega2 * sin - b2 * v) * m * l * cos;
        const denomTheta = commonDenom * m * l; 
        const a_theta = numerTheta / denomTheta;

        // --- Метод Ейлера (Інтегрування) ---
        this.state.x += v * dt;
        this.state.v += a_x * dt;
        this.state.theta += omega * dt;
        this.state.omega += a_theta * dt;

        // Обмеження візка стінами
        if (this.state.x > 2.5) { this.state.x = 2.5; this.state.v = 0; }
        if (this.state.x < -2.5) { this.state.x = -2.5; this.state.v = 0; }

        return this.state;
    }
}