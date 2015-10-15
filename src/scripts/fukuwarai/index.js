let video;
let ctrack;

const videocanvas = document.createElement('canvas');


//------------------

export function start(video_, ctrack_) {
  video = video_;
  ctrack = ctrack_;

  videocanvas.width = video.width;
  videocanvas.height = video.height;
}

export function onMidi(data) {
  // on
  if(data.message == 144) {
    // console.log(data);
  }
}