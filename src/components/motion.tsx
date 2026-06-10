export const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
}

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
}
