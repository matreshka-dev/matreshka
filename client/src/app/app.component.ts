import {
  ChangeDetectionStrategy,
  Component,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { OverlaysComponent } from './components/local/overlays/overlays.component';
import { PLATFORM } from './platforms/platform';
import { EnvironmentService } from './services/environment.service';
import { PopupService } from './services/popup.service';
import { PostmanService } from './services/postman.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [RouterOutlet, OverlaysComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  postman = inject(PostmanService);
  env = inject(EnvironmentService);
  router = inject(Router);
  platform = inject(PLATFORM);
  popupService = inject(PopupService); // Не удалять, нужен для обработки событий открытия попапов
  constructor() {
    const source = this.env.source();
    this.postman.attachSource(source);
  }
}
