export default class View {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.scale = 200; 
        
        this.centerX = this.width / 2;
        this.centerY = this.height - 100; 
    }

    draw(state) {
        const ctx = this.ctx;
        
        ctx.clearRect(0, 0, this.width, this.height);

        // КАМЕРА СЛІДУЄ ЗА ВІЗКОМ: Візок завжди по центру Canvas
        const cartX = this.centerX; 
        const cartY = this.centerY;
        
        const poleLengthPixels = 0.5 * 2 * this.scale; 

        // Координати кінця палиці
        const poleX = cartX + poleLengthPixels * Math.sin(state.theta);
        const poleY = cartY - poleLengthPixels * Math.cos(state.theta);

        // --- 1. ІЛЮЗІЯ РУХУ: Безкінечні рейки та шпали ---
        ctx.beginPath();
        ctx.moveTo(0, cartY + 25);
        ctx.lineTo(this.width, cartY + 25);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Малюємо шпали, які зміщуються залежно від реальної позиції візка (state.x)
        const sleeperSpacing = 50; // Відстань між шпалами
        const offset = -(state.x * this.scale) % sleeperSpacing; // Зміщення фону
        
        ctx.beginPath();
        // Малюємо лінії від лівого краю до правого з урахуванням зміщення
        for (let i = offset - sleeperSpacing; i < this.width + sleeperSpacing; i += sleeperSpacing) {
            ctx.moveTo(i, cartY + 25);
            ctx.lineTo(i, cartY + 40);
        }
        ctx.strokeStyle = '#888';
        ctx.lineWidth = 4;
        ctx.stroke();

        // --- 1.5 МАЛЮВАННЯ СТАРТОВОЇ ПОЗНАЧКИ (0 МЕТРІВ) ---
        // Оскільки візок завжди по центру (cartX), координата 0 на екрані зміщується вліво/вправо
        const startMarkerX = cartX - state.x * this.scale;
        
        // Малюємо позначку тільки якщо вона знаходиться в межах видимості екрану
        if (startMarkerX > -50 && startMarkerX < this.width + 50) {
            ctx.beginPath();
            ctx.moveTo(startMarkerX, cartY + 25);
            ctx.lineTo(startMarkerX, cartY - 30); // Висота стовпчика
            ctx.strokeStyle = '#e74c3c'; // Червоний колір
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Текст "СТАРТ"
            ctx.fillStyle = '#e74c3c';
            ctx.font = "bold 14px 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("СТАРТ", startMarkerX, cartY - 35);
        }

        
        // --- 2. МАЛЮВАННЯ ВІЗКА (Статично по центру) ---
        ctx.fillStyle = '#4a90e2'; 
        ctx.fillRect(cartX - 60, cartY - 30, 120, 50); 
        
        // Малюємо колеса (додаємо обертання коліс для більшої реалістичності)
        const wheelRadius = 12;
        const wheelAngle = (state.x * this.scale) / wheelRadius; // Кут повороту колеса

        const drawWheel = (cx, cy) => {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(wheelAngle);
            ctx.beginPath();
            ctx.arc(0, 0, wheelRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#333';
            ctx.fill();
            // Спиця на колесі, щоб було видно обертання
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(wheelRadius, 0);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        };

        drawWheel(cartX - 35, cartY + 20);
        drawWheel(cartX + 35, cartY + 20);

        // --- 3. МАЛЮВАННЯ МАЯТНИКА ---
        ctx.beginPath();
        ctx.moveTo(cartX, cartY);
        ctx.lineTo(poleX, poleY);
        ctx.strokeStyle = '#e74c3c'; 
        ctx.lineWidth = 10;
        ctx.lineCap = 'round';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(cartX, cartY, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.stroke();

        // --- 4. GAME OVER СТАТУС ---
        if (Math.abs(state.theta) > Math.PI / 2) {
            ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
            ctx.fillRect(0, 0, this.width, this.height);
            ctx.fillStyle = "red";
            ctx.font = "bold 30px 'Segoe UI', sans-serif";
            ctx.textAlign = "center";
            ctx.fillText("ВПАВ!", this.width / 2, this.height / 2);
        }
    }
}