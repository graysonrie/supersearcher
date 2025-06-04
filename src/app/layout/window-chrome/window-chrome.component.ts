import { Component } from '@angular/core';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { TauriLifecycleService } from '../../core/services/tauri/lifecycle.service';

/** This is the mac traffic light lookin window chrome */
@Component({
  selector: 'app-window-chrome',
  standalone: true,
  imports: [],
  templateUrl: './window-chrome.component.html',
  styleUrl: './window-chrome.component.scss'
})
export class WindowChromeComponent {

  constructor(private lifecycleService: TauriLifecycleService) { }

  async closeApp() {
    await this.lifecycleService.onShutdown();
    getCurrentWindow().close();
  }

  minimizeApp() {
    getCurrentWindow().minimize();
  }

  async toggleMaximize() {
    const appWindow = getCurrentWindow();
    const isMaximized = await appWindow.isMaximized();
    if (isMaximized) {
      appWindow.unmaximize();
    } else {
      appWindow.maximize();
    }
  }
}
