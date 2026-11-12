// One pen per cell or slot, alive exactly while it is in the extended
// viewport — created on entry, dropped on exit, so no pen and no trace
// cache outlives the pan history. Both wall layers (windows and texture
// slots) share this ledger.
import type { Pen } from '@/pen/pen';
import { planPens } from './pens';

export class PenLedger {
  private readonly pens = new Map<string, Pen>();

  constructor(private readonly make: (key: string) => Pen) {}

  sync(wanted: string[]): void {
    const plan = planPens(new Set(this.pens.keys()), wanted);
    plan.drop.forEach((key) => this.pens.delete(key));
    plan.create.forEach((key) => this.pens.set(key, this.make(key)));
  }

  get(key: string): Pen {
    return this.pens.get(key)!;
  }

  clear(): void {
    this.pens.clear();
  }
}
