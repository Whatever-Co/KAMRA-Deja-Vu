import './trackrtest.sass';
import body from './trackrtest.jade';
document.body.innerHTML = body();

import FaceTracker from './facetracker';


class App {

  constructor() {
    this.animate = this.animate.bind(this);

    this.tracker = new FaceTracker();
    this.tracker.startVideo('media/cap13_edit2.mp4');

    let container = document.querySelector('#container');
    container.appendChild(this.tracker.target);
    container.appendChild(this.tracker.debugCanvas);

    this.canvas = document.querySelector('#face');
    this.context = this.canvas.getContext('2d');

    this.animate();
  }


  animate() {
    requestAnimationFrame(this.animate);

    if (this.tracker.normalizedPoints) {
      this.drawNormalizedFace(this.tracker.normalizedPoints);
    }
  }


  drawNormalizedFace(points) {

    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.context.save();

    this.context.translate(this.canvas.width / 2, this.canvas.height / 2);
    let scale = this.canvas.width * 0.5 * 0.8;
    this.context.scale(scale, scale);

    this.context.strokeStyle = 'black';
    this.context.lineWidth = 0.5 / scale;

    this.tracker.model.path.normal.forEach((path) => {
      if (typeof(path) == 'number') return;
      this.context.beginPath();
      path.forEach((i, j) => {
        let p = points[i];
        if (j == 0) {
          this.context.moveTo(p[0], p[1]);
        } else {
          this.context.lineTo(p[0], p[1]);
        }
      });
      this.context.stroke();
    });

    this.context.restore();
  }

}


new App();
