import { ref } from 'vue';

const inspireOpen = ref(false);
export function useInspirationDialog() {
  return {
    inspireOpen,
    openInspiration: () => {
      inspireOpen.value = true;
    },
  };
}
