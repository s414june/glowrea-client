export function useHomeRefreshSignal() {
  const signal = useState<number>('home:refresh-signal', () => 0)

  function triggerHomeRefresh(): void {
    signal.value = Date.now()
  }

  return {
    signal,
    triggerHomeRefresh
  }
}
