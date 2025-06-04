import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { QuickAccessPath } from '@core/services/files/quick-access.service';
import { ButtonWIconComponent } from "../../../../shared/components/buttons/button-w-icon/button-w-icon.component";
import { ButtonWSvgComponent } from "../../../../shared/components/buttons/button-w-svg/button-w-svg.component";

@Component({
  selector: 'app-quick-access-shortcut',
  standalone: true,
  imports: [CommonModule, ButtonWSvgComponent, ButtonWIconComponent],
  templateUrl: './quick-access-shortcut.component.html',
  styleUrl: './quick-access-shortcut.component.css'
})
export class QuickAccessShortcutComponent {
  @Input() path:QuickAccessPath | undefined;

  constructor(){}

  getIconName():string{
    if(this.path){
      // The alias name, so `Desktop` for example
      const name = this.path.name.toLowerCase();
      return name;
    }
    return "";
  }
}
