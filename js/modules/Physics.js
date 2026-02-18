export default class Physics {
    constructor() {
        this.M = 5.0;     
        this.m = 0.1;     
        this.l = 0.5;     
        this.g = 9.8;     
        this.b1 = 0.1;    
        this.b2 = 1.0; // В'язкість

        this.state = { x: 0, v: 0, theta: 0.1, omega: 0 };
        
        // Поточний метод інтегрування ('euler' або 'rk4')
        this.integrator = 'rk4'; 
    }

    reset() {
        this.state = { x: 0, v: 0, theta: (Math.random() - 0.5) * 0.2, omega: 0 };
    }

    // --- ФІЗИКА: Розрахунок прискорень ---
    getAccelerations(state, force) {
        const { v, theta, omega } = state;
        const { M, m, l, g, b1, b2 } = this;
        const sin = Math.sin(theta);
        const cos = Math.cos(theta);
        const omega2 = omega * omega;

        const commonDenom = (M + m) * l - m * l * cos * cos;
        
        // a_x (Прискорення візка)
        const numerX = (force + m * l * omega2 * sin - b2 * v) * l - (m * g * l * sin - b1 * omega) * cos;
        const a_x = numerX / commonDenom;

        // a_theta (Кутове прискорення)
        const numerTheta = (m * g * l * sin - b1 * omega) * (M + m) - (force + m * l * omega2 * sin - b2 * v) * m * l * cos;
        
        // --- ВИПРАВЛЕННЯ ТУТ ---
        // Ми додали цей рядок, який загубився
        const denomTheta = commonDenom * m * l; 
        
        const a_theta = numerTheta / denomTheta;

        return { a_x, a_theta };
    }

    // --- МЕТОД 1: Ейлер ---
    stepEuler(force, dt) {
        const acc = this.getAccelerations(this.state, force);
        
        this.state.x += this.state.v * dt;
        this.state.v += acc.a_x * dt;
        this.state.theta += this.state.omega * dt;
        this.state.omega += acc.a_theta * dt;
    }

    // --- МЕТОД 2: Рунге-Кутта 4 ---
    stepRK4(force, dt) {
        const s = this.state;

        // K1
        const a1 = this.getAccelerations(s, force);
        const k1 = { v: s.v, omega: s.omega, ax: a1.a_x, atheta: a1.a_theta };

        // K2
        const s2 = {
            x: s.x + k1.v * 0.5 * dt,
            v: s.v + k1.ax * 0.5 * dt,
            theta: s.theta + k1.omega * 0.5 * dt,
            omega: s.omega + k1.atheta * 0.5 * dt
        };
        const a2 = this.getAccelerations(s2, force);
        const k2 = { v: s2.v, omega: s2.omega, ax: a2.a_x, atheta: a2.a_theta };

        // K3
        const s3 = {
            x: s.x + k2.v * 0.5 * dt,
            v: s.v + k2.ax * 0.5 * dt,
            theta: s.theta + k2.omega * 0.5 * dt,
            omega: s.omega + k2.atheta * 0.5 * dt
        };
        const a3 = this.getAccelerations(s3, force);
        const k3 = { v: s3.v, omega: s3.omega, ax: a3.a_x, atheta: a3.a_theta };

        // K4
        const s4 = {
            x: s.x + k3.v * dt,
            v: s.v + k3.ax * dt,
            theta: s.theta + k3.omega * dt,
            omega: s.omega + k3.atheta * dt
        };
        const a4 = this.getAccelerations(s4, force);
        const k4 = { v: s4.v, omega: s4.omega, ax: a4.a_x, atheta: a4.a_theta };

        // Фінальне зважування
        this.state.x += (dt / 6) * (k1.v + 2*k2.v + 2*k3.v + k4.v);
        this.state.v += (dt / 6) * (k1.ax + 2*k2.ax + 2*k3.ax + k4.ax);
        this.state.theta += (dt / 6) * (k1.omega + 2*k2.omega + 2*k3.omega + k4.omega);
        this.state.omega += (dt / 6) * (k1.atheta + 2*k2.atheta + 2*k3.atheta + k4.atheta);
    }

    update(force, dt) {
        if (this.integrator === 'euler') {
            this.stepEuler(force, dt);
        } else {
            this.stepRK4(force, dt);
        }

        // ВИДАЛЕНО: Жорсткі стіни (щоб маятник міг їхати по безкінечній карті)
        // if (this.state.x > 2.5) { ... }
        // if (this.state.x < -2.5) { ... }

    return this.state;
}
}