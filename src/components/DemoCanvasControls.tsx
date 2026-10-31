import { useEffect, useRef, useState } from 'react';
import { Slider } from 'radix-ui';
import { handleRegistered, tuningHandleFor, type TuningHandle } from './mount';
import styles from './DemoCanvasControls.module.css';

export interface ParamSpec {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
}

interface Props {
  params: ParamSpec[];
}

export default function DemoCanvasControls({ params }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [handle, setHandle] = useState<TuningHandle | null>(null);
  const [snap, setSnap] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    // Binding through the enclosing demo frame means the panel can never be
    // wired to the wrong demo.
    const canvas = ref.current?.closest('[data-demo-frame]')?.querySelector('canvas[data-demo]');
    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('demo canvas controls: no demo canvas in the enclosing frame');
    }
    let unsub: (() => void) | undefined;
    let cancelled = false;
    handleRegistered(canvas).then(() => {
      if (cancelled) return;
      const found = tuningHandleFor(canvas);
      if (!found) throw new Error('demo canvas controls: demo mounted without a tuning handle');
      const update = () => setSnap(found.snapshot());
      update();
      unsub = found.subscribe(update);
      setHandle(found);
    });
    return () => {
      cancelled = true;
      unsub?.();
    };
  }, []);

  const setParam = (key: string, value: number) => {
    handle?.setParam(key, value);
    if (handle) setSnap(handle.snapshot());
  };

  return (
    <div ref={ref} className={styles.panel}>
      {params.map((spec) => (
        <label key={spec.key} className={styles.sliderRow}>
          <span className={styles.paramLabel} title={spec.label}>{spec.label}</span>
          <Slider.Root
            className={styles.sliderRoot}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            value={[snap ? snap[spec.key] : spec.min]}
            onValueChange={([v]) => setParam(spec.key, v)}
            disabled={!handle}
          >
            <Slider.Track className={styles.sliderTrack}>
              <Slider.Range className={styles.sliderRange} />
            </Slider.Track>
            <Slider.Thumb className={styles.sliderThumb} aria-label={spec.label} />
          </Slider.Root>
          <output className={styles.value}>{snap ? String(snap[spec.key]) : '–'}</output>
        </label>
      ))}
    </div>
  );
}
