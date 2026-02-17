export default class FuzzyLogic {
    constructor() {
        this.K_theta = 1.0 / (Math.PI / 6); 
        this.K_dtheta = 1.0;                
        this.K_out = 10.0; // Трохи піднімемо силу, бо ми збільшили тертя (b2)

        this.rulesOutput = {
            "NB": -1.0, "NM": -0.66, "NS": -0.33,
            "ZE": 0.0,
            "PS": 0.33, "PM": 0.66, "PB": 1.0
        };

        // --- ЗМІНА 3: Пам'ять про попередню силу ---
        this.prevForce = 0;
    }

    trimf(x, a, b, c) { return Math.max(0, Math.min((x - a) / (b - a), (c - x) / (c - b))); }

    compute(state) {
        // ... (весь код фаззифікації і правил лишається тим самим) ...
        let error = state.theta * this.K_theta;      
        let dError = state.omega * this.K_dtheta;    
        error = Math.max(-1, Math.min(1, error));
        dError = Math.max(-1, Math.min(1, dError));
        
        let theta_NE = this.trimf(error, -2, -1, 0);
        let theta_ZE = this.trimf(error, -1, 0, 1);
        let theta_PO = this.trimf(error, 0, 1, 2);
        let dTheta_NE = this.trimf(dError, -2, -1, 0);
        let dTheta_ZE = this.trimf(dError, -1, 0, 1);
        let dTheta_PO = this.trimf(dError, 0, 1, 2);

        let rules = [];
        rules.push({ weight: Math.min(theta_NE, dTheta_NE), term: "NB" });
        rules.push({ weight: Math.min(theta_NE, dTheta_ZE), term: "NM" });
        rules.push({ weight: Math.min(theta_NE, dTheta_PO), term: "ZE" });
        rules.push({ weight: Math.min(theta_ZE, dTheta_NE), term: "NS" });
        rules.push({ weight: Math.min(theta_ZE, dTheta_ZE), term: "ZE" });
        rules.push({ weight: Math.min(theta_ZE, dTheta_PO), term: "PS" });
        rules.push({ weight: Math.min(theta_PO, dTheta_NE), term: "ZE" });
        rules.push({ weight: Math.min(theta_PO, dTheta_ZE), term: "PM" });
        rules.push({ weight: Math.min(theta_PO, dTheta_PO), term: "PB" });

        let numerator = 0;
        let denominator = 0;
        for (let r of rules) {
            if (r.weight > 0) {
                let centerValue = this.rulesOutput[r.term];
                numerator += r.weight * centerValue;
                denominator += r.weight;
            }
        }
        let output = 0;
        if (denominator !== 0) output = numerator / denominator;

        let targetForce = output * this.K_out;

        // --- ЗМІНА 4: Згладжування (Low Pass Filter) ---
        // Нова сила = 80% старої сили + 20% нової
        // Це вбиває різкі скачки (вібрацію)
        let smoothedForce = 0.8 * this.prevForce + 0.2 * targetForce;
        
        this.prevForce = smoothedForce; // Запам'ятовуємо на наступний раз

        // Обмеження
        const MAX_FORCE = 150; // Даємо трохи більше сили, бо візок став "важчим"
        if (smoothedForce > MAX_FORCE) smoothedForce = MAX_FORCE;
        if (smoothedForce < -MAX_FORCE) smoothedForce = -MAX_FORCE;

        return smoothedForce;
    }
}