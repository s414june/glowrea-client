export function useProfileRefreshSignal() {
  const signal = useState<number>('profile:refresh-signal', () => 0)

  function triggerProfileRefresh(): void {
    signal.value = Date.now()
  }

  return {
    signal,
    triggerProfileRefresh
  }
}
