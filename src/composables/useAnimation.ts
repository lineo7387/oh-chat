import { animate, cubicBezier, utils } from 'animejs'

const organicEase = cubicBezier(0.22, 1, 0.36, 1)

export function animateEnter(el: HTMLElement, options?: { delay?: number; duration?: number }) {
  return animate(el, {
    opacity: [0, 1],
    translateY: [20, 0],
    scale: [0.95, 1],
    duration: options?.duration ?? 400,
    delay: options?.delay ?? 0,
    ease: organicEase,
  })
}

export function animateMessageIn(el: HTMLElement, options?: { delay?: number }) {
  return animate(el, {
    opacity: [0, 1],
    translateY: [16, 0],
    duration: 350,
    delay: options?.delay ?? 0,
    ease: organicEase,
  })
}

export function animateBlob(el: HTMLElement, delay: number = 0) {
  return animate(el, {
    translateX: () => utils.random(-30, 30),
    translateY: () => utils.random(-30, 30),
    rotate: () => utils.random(-3, 3),
    duration: () => utils.random(15000, 25000),
    delay,
    alternate: true,
    loop: true,
    ease: 'inOutSine',
  })
}

export function animateScalePress(el: HTMLElement) {
  return animate(el, {
    scale: [1, 0.95, 1],
    duration: 150,
    ease: organicEase,
  })
}

export function animateSlideIn(el: HTMLElement, direction: 'left' | 'right' = 'right') {
  return animate(el, {
    opacity: [0, 1],
    translateX: direction === 'right' ? [-60, 0] : [60, 0],
    duration: 400,
    ease: organicEase,
  })
}
