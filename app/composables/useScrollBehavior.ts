/**
 * Tracks scroll position and direction.
 *
 * headerVisible  — true while at top or scrolling up; false while scrolling down
 *                  (used to auto-hide the mobile header)
 * showScrollTop  — true when scrolled past SCROLL_TOP_TRIGGER and scrolling up
 *                  (used to show the jump-to-top FAB)
 */
export function useScrollBehavior() {
  const headerVisible = ref(true)
  const showScrollTop = ref(false)

  const JITTER_THRESHOLD = 6    // px — ignore tiny scroll noise
  const HIDE_HEADER_AT = 60     // px — don't hide header near the top
  const SCROLL_TOP_TRIGGER = 400 // px — how far down before the button appears

  let lastY = 0

  function onScroll(): void {
    const y = window.scrollY
    const delta = y - lastY

    if (Math.abs(delta) < JITTER_THRESHOLD) return

    const goingDown = delta > 0

    // Header: hide when scrolling down (past threshold), reveal on any upward scroll
    if (goingDown && y > HIDE_HEADER_AT) {
      headerVisible.value = false
    } else if (!goingDown) {
      headerVisible.value = true
    }

    // Scroll-to-top button: only visible when scrolled far down AND moving up
    showScrollTop.value = y > SCROLL_TOP_TRIGGER && !goingDown

    lastY = y
  }

  onMounted(() => {
    lastY = window.scrollY
    window.addEventListener('scroll', onScroll, { passive: true })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', onScroll)
  })

  function scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return { headerVisible, showScrollTop, scrollToTop }
}
