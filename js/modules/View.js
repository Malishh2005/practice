export default class View {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Розміри екрану
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        
        // Масштаб: 1 метр фізичного світу = 100 пікселів на екрані
        this.scale = 200; 
        
        // Центр екрану (де стоїть візок при x=0)
        this.centerX = this.width / 2;
        this.centerY = this.height - 100; // Земля трохи нижче центру
    }

    // Головний метод малювання
    // state - це об'єкт з Physics.js {x, v, theta, omega}
    draw(state) {
        const ctx = this.ctx;
        
        // 1. Очистити екран
        ctx.clearRect(0, 0, this.width, this.height);

        // 2. Розрахунок координат
        // x - позиція візка
        // theta - кут нахилу
        const cartX = this.centerX + state.x * this.scale;
        const cartY = this.centerY;
        
        // Довжина палиці (візуальна, трохи довша за фізичний центр мас L=0.5)
        const poleLengthPixels = 0.5 * 2 * this.scale; 

        // Координати кінця палиці (верхньої кульки)
        // Math.sin(theta) дає зміщення по X
        // Math.cos(theta) дає зміщення по Y (мінус, бо в Canvas Y росте вниз)
        const poleX = cartX + poleLengthPixels * Math.sin(state.theta);
        const poleY = cartY - poleLengthPixels * Math.cos(state.theta);

        // --- МАЛЮВАННЯ ---

        // 3. Земля (рейки)
        ctx.beginPath();
        ctx.moveTo(0, cartY + 25);
        ctx.lineTo(this.width, cartY + 25);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 4. Візок (прямокутник)
        ctx.fillStyle = '#4a90e2'; // Синій колір
        ctx.fillRect(cartX - 60, cartY - 30, 120, 50); // Центруємо прямокутник
        
        // Колеса візка
        ctx.beginPath();
        ctx.arc(cartX - 35, cartY + 20, 12, 0, Math.PI * 2);
        ctx.arc(cartX + 35, cartY + 20, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#333';
        ctx.fill();

        // 5. Маятник (палиця)
        ctx.beginPath();
        ctx.moveTo(cartX, cartY);
        ctx.lineTo(poleX, poleY);
        ctx.strokeStyle = '#e74c3c'; // Червоний колір
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();

        // 6. Шарнір (точка з'єднання)
        ctx.beginPath();
        ctx.arc(cartX, cartY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();

        // 7. Візуалізація "Game Over" (якщо кут > 90 градусів)
        if (Math.abs(state.theta) > Math.PI / 2) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.fillRect(0, 0, this.width, this.height);
            
            ctx.fillStyle = "red";
            ctx.font = "30px Arial";
            ctx.textAlign = "center";
            ctx.fillText("ВПАВ!", this.width / 2, this.height / 2);
        }
    }
}