import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { ToastService } from "./toast.service";

@Component({
  selector: "app-toast",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./toast.component.html",
  styleUrl: "./toast.component.css",
})
export class ToastComponent {
  toast$ = this.toastService.toast$;

  constructor(private toastService: ToastService) {}
}
