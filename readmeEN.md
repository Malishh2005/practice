# Inverted Pendulum Simulation & Control

This is an interactive physics simulation of an inverted pendulum on a cart. I built this project to practice control theory and mathematical optimization. The goal is to stabilize the pendulum using a Fuzzy Logic controller and automatically optimize its parameters using global search algorithms.

## Core Mechanics & Tech Stack

* **Physics Engine:** Custom simulation built from scratch using Lagrangian mechanics. It supports both Euler and Runge-Kutta 4th Order (RK4) integration methods to compare accuracy.
* **Control System:** A Fuzzy Controller with 9 rule bases. It processes 4 inputs: cart angle, angular velocity, position, and velocity.
* **Optimization (AI Training):** Implemented Genetic Algorithms (GA) and Particle Swarm Optimization (PSO) to find the best control coefficients ($K_{\theta}, K_{\omega}, K_{out}, K_{x}, K_{v}$).
* **Stack:** Vanilla JavaScript (ES6 Modules), HTML5 Canvas for rendering, and Chart.js for real-time statistics.

## How the Training Works

When the training process is triggered, the algorithm (GA or PSO) runs hundreds of simulated background tests. It calculates a "Fitness" score based on the mean squared error (MSE) of the pendulum's angle and the control effort spent on stabilization. The best performing coefficients are then automatically applied to the active controller.

## How to Run Locally

Since the project uses ES6 Modules, you need a local web server to run it (simply opening the file in a browser won't work).
1. Clone the repo.
2. Start a local server in the root folder (e.g., using the "Live Server" extension in VS Code).
3. Open `index.html`.

**Note on UI:** The interface is currently in Ukrainian. 
* Click **"Навчити"** to start the AI training process.
* Click **"Поштовх"** to simulate an external physical push on the pendulum.
* Click **"Скинути"** to reset the simulation.
