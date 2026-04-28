export function useMoreMenu() {
  const isOpen = useState<boolean>('more-menu:open', () => false)

  function toggle(): void {
    isOpen.value = !isOpen.value
  }

  function close(): void {
    isOpen.value = false
  }

  function open(): void {
    isOpen.value = true
  }

  return { isOpen, toggle, close, open }
}
