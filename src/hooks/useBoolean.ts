import { useCallback, useState } from 'react';

export const useBoolean = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  const setTrue = useCallback(() => setValue(true), []);
  const setFalse = useCallback(() => setValue(false), []);
  const toggle = useCallback(() => setValue((current) => !current), []);

  return { value, setValue, setTrue, setFalse, toggle };
};
