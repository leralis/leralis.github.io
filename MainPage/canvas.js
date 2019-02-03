"use strict";

const DISTANCE_BETWEEN_VERTICES = 200; 

class Point {
  constructor(opts) {
    let { x, y, angle, velocity } = opts;
    this.x = x;
    this.y = y;
    this.angle = angle;
    this.velocity = velocity; 
  }

  move() {
    this.x = this.x + Math.cos(this.angle) * this.velocity;
    this.y = this.y + Math.sin(this.angle) * this.velocity;
  }

  getNextCoordinates(){
      this.nextX = this.x + Math.sin(this.angle) * this.velocity;
      this.nextY = this.y + Math.cos(this.angle) * this.velocity;
      this.nextCoordinates = {x: this.nextX, y: this.nextY}
      return this.nextCoordinates;
  }

}

class Graph {
  constructor(opts = {}) {
    let { points, connectionFn } = opts;
    let defaultConnectionFn = () => true;
    this.points = points || [];
    this.connectionFn = connectionFn || defaultConnectionFn;

    this.initConnections();
    this.calculateConnections();
  }

  initConnections() {
    let points = this.points;
    if (points && points.length) {
      this.connections = new Array(points.length);
      points.forEach((point, i, arr) => {
        this.connections[i] = new Array(points.length);
      });
    } else {
      this.connections = [];
    }
  }

  addPoint(point) {
    this.points.push(point);
    this.initConnections();
    this.calculateConnections();
  }

  removePoint(point) {
    this.points = this.points.filter((el) => {
      return point !== el;
    });
    this.initConnections();
    this.calculateConnections();
  }

  getPoints() {
    return this.points;
  }

  getConnections() {
    return this.connections;
  }

  move() {
    this.points.forEach(point => point.move());
    this.calculateConnections();
    this.points.forEach(point => {
      let nextCoords = point.getNextCoordinates();
      if (nextCoords.x >= canvas.width || nextCoords.x < 0) {
        point.velocity = -(point.velocity)
      }
      if (nextCoords.y >= canvas.height || nextCoords.y < 0) {
        point.velocity = -(point.velocity)
      }
      nextCoords.x  += point.velocity;
      nextCoords.y  += point.velocity;
    })
  }

  calculateConnections() {
    let points = this.points;
    if (points.length > 1) {
      points.forEach((a, outerIndex) => {
        let innerList = points.slice(0, outerIndex + 1);
        innerList.forEach((b, innerIndex) => {
          let hasConnection;
          if (outerIndex !== innerIndex) {
            hasConnection = this.connectionFn(a, b);
          } else {
            hasConnection = false;
          }
          this.connections[outerIndex][innerIndex] = hasConnection;
        });
      });
    }
  }

  removePointsByCriteria(criteriaFn) {
    this.points.forEach(el => {
      if (!criteriaFn(el)) {
        this.removePoint(el);
      }
    });
    this.initConnections();
    this.calculateConnections(criteriaFn);
  }
}

class Demo {
  constructor(opts) {
    let { id, connectionFn } = opts;
    this.graph = new Graph({ connectionFn });
    this.canvas = document.getElementById(id);
    this.ctx = this.canvas.getContext('2d');
    this.drawer = new Drawer(this.ctx);
    this.setupEmergenceArea();
    
  }

  random(min,max) {
    return Math.floor(Math.random()*(max-min)) + min;
    
  }

  setupEmergenceArea(){
    for (let i = 0; i<5; i++){
      this.region = [];
      this.region.x = this.random(100, this.canvas.width-100);
      this.region.y = this.random(100, this.canvas.height-100);
      let quantity = this.random(5, 10);

      for ( let i = 0; i<quantity; i++){
        let x = this.random(this.region.x-100, this.region.x+100);
        let y = this.random(this.region.y-100, this.region.y+100);
        let velocity = Math.random() + 0.3;
        let angle = Math.random() * (Math.PI * 2);
        let options = { x, y, velocity, angle };
        let point = new Point(options);
        this.graph.addPoint(point);
      }
  }
}
  


  clear() {
    let ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = "#e8eaec";
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  mainLoop() {
    this.render();
    this.graph.move();
    this.removePointsOutOfScreen();
  }

  render() {
    let points = this.graph.getPoints();
    let connections = this.graph.getConnections();
    this.clear();
    if (points.length) {
      this.drawer.drawConnections(points, connections);
      points.forEach((point) => {
        this.drawer.drawPoint(point);
      });
    }
    this.drawer.drawVignette(this.canvas.width, this.canvas.height);
    requestAnimationFrame(this.mainLoop.bind(this));
  }

  removePointsOutOfScreen() {
    this.graph.removePointsByCriteria(point => {
      return (point.x < this.canvas.width && point.x > 0) &&
             (point.y < this.canvas.height && point.y > 0);
    });
  }
}

class Drawer {
  constructor(ctx) {
    this.ctx = ctx;
  }
  drawPoint(point) {
    let ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.translate(point.x, point.y);
    ctx.arc(0, 0, 3, 0, Math.PI * 2, false);
    ctx.fillStyle = "#97b1d8";
    ctx.strokeStyle = "#43536c"
    ctx.lineWidth = 1;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  drawConnections(points, connections) {
    points.forEach((a, outerIndex) => {
      let innerList = points.slice(0, outerIndex + 1);
      innerList.forEach((b, innerIndex) => {
        if (connections[outerIndex][innerIndex]) {
          this.drawConnection(a, b);
        }
      });
    });
  };

  drawConnection(start, end) {
    let ctx = this.ctx;
    ctx.beginPath();
    ctx.strokeStyle = "#141328";
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
  }

  drawBackground() {

  }

  drawVignette(width, height) {
    let ctx = this.ctx;
    let centerX = width / 2;
    let centerY = height / 2;
    let innerRadius = width / 2.5;
    ctx.save();

    let grd = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, width);
    grd.addColorStop(0,"transparent");
    grd.addColorStop(1,"#212d41");

    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

let canvas = document.getElementById('scene');
canvas.width = screen.availWidth;
canvas.height = screen.availHeight;
const demo = new Demo({
  id: 'scene',
  connectionFn: (a, b) => {
    let distance = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
    return distance < DISTANCE_BETWEEN_VERTICES;
  }
});

demo.mainLoop();
