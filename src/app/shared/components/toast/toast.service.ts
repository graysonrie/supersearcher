import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export interface ToastState {
  id: number;
  message: string;
  sticky: boolean;
}

@Injectable({ providedIn: "root" })
export class ToastService {
  private readonly toastSubject = new BehaviorSubject<ToastState | null>(null);
  readonly toast$ = this.toastSubject.asObservable();

  private nextId = 1;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  show(message: string, options?: { sticky?: boolean }): number {
    this.clearDismissTimer();
    const id = this.nextId++;
    const sticky = options?.sticky ?? false;
    this.toastSubject.next({ id, message, sticky });
    if (!sticky) {
      this.scheduleDismiss(id, 3000);
    }
    return id;
  }

  update(id: number, message: string, options?: { sticky?: boolean }): void {
    const current = this.toastSubject.value;
    if (!current || current.id !== id) {
      this.show(message, options);
      return;
    }

    this.clearDismissTimer();
    const sticky = options?.sticky ?? false;
    this.toastSubject.next({ id, message, sticky });
    if (!sticky) {
      this.scheduleDismiss(id, 3000);
    }
  }

  dismiss(id?: number): void {
    const current = this.toastSubject.value;
    if (!current) {
      return;
    }
    if (id !== undefined && current.id !== id) {
      return;
    }
    this.clearDismissTimer();
    this.toastSubject.next(null);
  }

  private scheduleDismiss(id: number, ms: number): void {
    this.dismissTimer = setTimeout(() => this.dismiss(id), ms);
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer !== null) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }
}
