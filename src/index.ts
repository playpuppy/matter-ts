//import { Common } from './core';
import { Vector } from './geometry';
import { Body, Composite, World } from './body';
import { Detector } from './collision';
import { Render } from './render';
//import { Constraint } from './constraint';
import { Bodies } from './factory';
import { Engine, Runner } from './core';

// export class Vector {
//   public x: number;
//   public y: number;

//   public constructor(x = 0, y = 0) {
//     this.x = x;
//     this.y = y;
//   }

//   public static Null = new Vector();
// }

// create engine
const world = new World();
console.log(world);

const engine = new Engine(world);
console.log(engine);

const render = new Render(engine, document.body);

// // fit the render viewport to the scene
// // Render.lookAt(render, {
// //   min: { x: 0, y: 0 },
// //   max: { x: 800, y: 600 }
// // });

//console.log(Bodies.rectangle(600, 100, 60, 60, { frictionAir: 0.1 }));
world.add([
  // falling blocks
  Bodies.rectangle(200, 100, 60, 60, { frictionAir: 0.001 }),
  Bodies.rectangle(400, 100, 60, 60, { frictionAir: 0.05 }),
  Bodies.rectangle(600, 100, 60, 60, { frictionAir: 0.1 }),

  // walls
  Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
  Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
  Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
  Bodies.rectangle(0, 300, 50, 600, { isStatic: true })
]);

render.run();

//create runner
var runner = new Runner();
Runner.run(runner, engine);

