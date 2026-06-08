import { Component, Input, OnDestroy, ViewChild, ElementRef, signal, computed, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-audio-player',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="audio-player" [class.is-playing]="isPlaying()">
      <audio #audioEl [src]="src" (timeupdate)="onTimeUpdate()" (loadedmetadata)="onMetadata()" (ended)="onEnded()"></audio>

      <button
        class="audio-player__play"
        (click)="togglePlay()"
        [attr.aria-label]="isPlaying() ? 'Pausar' : 'Reproducir'">
        @if (isPlaying()) {
          <!-- Pause icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        } @else {
          <!-- Play icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
        }
      </button>

      <div class="audio-player__info">
        <span class="audio-player__title">{{ title }}</span>
        <span class="audio-player__subtitle">{{ subtitle }}</span>
        <div class="audio-player__progress-wrap" (click)="seek($event)" role="progressbar"
          [attr.aria-valuenow]="currentTime()" [attr.aria-valuemax]="duration()" aria-label="Progreso">
          <div class="audio-player__track">
            <div class="audio-player__fill" [style.width.%]="progressPct()"></div>
          </div>
        </div>
      </div>

      <span class="audio-player__time">
        {{ formatTime(currentTime()) }} / {{ formatTime(duration()) }}
      </span>
    </div>
  `,
  styles: [`
    $brand:  #7B1716;
    $accent: #E6C15A;
    $bg-alt: #EDE9DF;
    $ink:    #1C1A14;
    $muted:  #6B6456;

    :host { display: block; }

    .audio-player {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      padding: 0.85rem 1.1rem;
      background: $bg-alt;
      border-radius: 40px;
    }

    .audio-player__play {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: $brand;
      color: $accent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: background 150ms, transform 150ms;

      &:hover { background: lighten($brand, 8%); transform: scale(1.05); }
    }

    .audio-player__info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .audio-player__title {
      font-family: 'Poppins', sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      color: $ink;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .audio-player__subtitle {
      font-family: 'Lora', serif;
      font-style: italic;
      font-size: 0.68rem;
      color: $muted;
    }

    .audio-player__progress-wrap {
      cursor: pointer;
      padding: 4px 0;
    }

    .audio-player__track {
      height: 3px;
      background: rgba($muted, 0.2);
      border-radius: 2px;
      overflow: hidden;
    }

    .audio-player__fill {
      height: 100%;
      background: $brand;
      border-radius: 2px;
      transition: width 100ms linear;
    }

    .audio-player__time {
      font-family: 'Poppins', sans-serif;
      font-size: 0.68rem;
      font-weight: 500;
      color: $muted;
      white-space: nowrap;
      flex-shrink: 0;
    }
  `]
})
export class AudioPlayerComponent implements OnDestroy {
  @Input() src = '';
  @Input() title = 'Cómo obtenemos la crema';
  @Input() subtitle = 'Tostado · Repelado · Molino de piedra';

  @ViewChild('audioEl') audioEl?: ElementRef<HTMLAudioElement>;

  private platformId = inject(PLATFORM_ID);

  readonly isPlaying = signal(false);
  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly progressPct = computed(() =>
    this.duration() > 0 ? (this.currentTime() / this.duration()) * 100 : 0
  );

  togglePlay(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const audio = this.audioEl?.nativeElement;
    if (!audio) return;
    if (this.isPlaying()) {
      audio.pause();
      this.isPlaying.set(false);
    } else {
      audio.play().catch(() => {});
      this.isPlaying.set(true);
    }
  }

  onTimeUpdate(): void {
    this.currentTime.set(this.audioEl?.nativeElement.currentTime ?? 0);
  }

  onMetadata(): void {
    this.duration.set(this.audioEl?.nativeElement.duration ?? 0);
  }

  onEnded(): void {
    this.isPlaying.set(false);
    this.currentTime.set(0);
  }

  seek(event: MouseEvent): void {
    const audio = this.audioEl?.nativeElement;
    if (!audio || !this.duration()) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * this.duration();
  }

  formatTime(seconds: number): string {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  ngOnDestroy(): void {
    this.audioEl?.nativeElement.pause();
  }
}
