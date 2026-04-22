import anime from 'animejs'

const ORGANIC_EASE = 'cubicBezier(0.22, 1, 0.36, 1)'

export function animateEnter(
  el: HTMLElement,
  options?: { delay?: number; duration?: number },
) {
  return anime({
    targets: el,
    opacity: [0, 1],
    translateY: [20, 0],
    scale: [0.95, 1],
    duration: options?.duration ?? 400,
    delay: options?.delay ?? 0,
    easing: ORGANIC_EASE,
  })
}

export function animateMessageIn(
  el: HTMLElement,
  options?: { delay?: number },
) {
  return anime({
    targets: el,
    opacity: [0, 1],
    translateY: [16, 0],
    duration: 350,
    delay: options?.delay ?? 0,
    easing: ORGANIC_EASE,
  })
}

export function animateBlob(el: HTMLElement, delay: number = 0) {
  return anime({
    targets: el,
    translateX: () => anime.random(-30, 30),
    translateY: () => anime.random(-30, 30),
    rotate: () => anime.random(-3, 3),
    duration: () => anime.random(15000, 25000),
    delay,
    direction: 'alternate',
    loop: true,
    easing: 'easeInOutSine',
  })
}

export function animateScalePress(el: HTMLElement) {
  return anime({
    targets: el,
    scale: [1, 0.95, 1],
    duration: 150,
    easing: ORGANIC_EASE,
  })
}

export function animateSlideIn(
  el: HTMLElement,
  direction: 'left' | 'right' = 'right',
) {
  return anime({
    targets: el,
    opacity: [0, 1],
    translateX: direction === 'right' ? [-60, 0] : [60, 0],
    duration: 400,
    easing: ORGANIC_EASE,
  })
}
