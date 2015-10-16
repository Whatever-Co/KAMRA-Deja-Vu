
/**
 * Resize dom as AspectFit
 * @param id
 * @param aspect
 */
export function aspectFit(id, aspect) {
  const dom = document.getElementById(id);
  const w = window.innerWidth;
  const h = window.innerHeight;

  let width,height,left,top;
  if(w/h > aspect) {
    width = h * aspect;
    height = h;
    left = (w - width) / 2;
    top = 0;
  } else {
    width = w;
    height = w / aspect;
    left = 0;
    top = (h - height) / 2;
  }
  dom.style.width = width + 'px';
  dom.style.height = height + 'px';
  dom.style.left = left + 'px';
  dom.style.top = top + 'px';
}
