import { Component, Input } from '@angular/core';
import {
  LucideCircleAlert,
  LucideFileClock,
  LucideFiles,
  LucideUnlink,
} from '@lucide/angular';

@Component({
  selector: 'app-resumen-repositorio',
  standalone: true,
  imports: [LucideCircleAlert, LucideFileClock, LucideFiles, LucideUnlink],
  template: `
    <section class="resumen" aria-label="Resumen del repositorio documental">
      <article>
        <span class="icono total"><svg lucideFiles size="19"></svg></span>
        <div><strong>{{ total }}</strong><span>documentos encontrados</span></div>
      </article>
      <article [class.destacado]="porRevisar > 0">
        <span class="icono revision"><svg lucideCircleAlert size="19"></svg></span>
        <div><strong>{{ porRevisar }}</strong><span>por revisar en esta página</span></div>
      </article>
      <article [class.destacado]="sinAsociar > 0">
        <span class="icono asociar"><svg lucideUnlink size="19"></svg></span>
        <div><strong>{{ sinAsociar }}</strong><span>sin petición asociada</span></div>
      </article>
      <article>
        <span class="icono borrador"><svg lucideFileClock size="19"></svg></span>
        <div><strong>{{ borradores }}</strong><span>borradores internos</span></div>
      </article>
    </section>
  `,
  styles: [
    `
      .resumen { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin-bottom:16px; }
      article { display:flex; align-items:center; gap:11px; min-width:0; padding:13px; border:1px solid #dfe7e2; border-radius:12px; background:#fff; }
      article.destacado { border-color:#e5c38a; background:#fffbf4; }
      .icono { display:grid; place-items:center; flex:0 0 auto; width:38px; height:38px; border-radius:10px; }
      .total { background:#e4f0e8; color:#226b3b; }
      .revision { background:#fff0dc; color:#935b0e; }
      .asociar { background:#fff0dc; color:#935b0e; }
      .borrador { background:#e8edf7; color:#435f91; }
      strong { display:block; color:#1f2c25; font-size:21px; line-height:1; }
      article div span { display:block; margin-top:4px; color:#65736b; font-size:12px; line-height:1.25; }
      @media(max-width:880px) { .resumen { grid-template-columns:repeat(2,minmax(0,1fr)); } }
      @media(max-width:500px) { .resumen { grid-template-columns:1fr; } }
    `,
  ],
})
export class ResumenRepositorioComponent {
  @Input() total = 0;
  @Input() porRevisar = 0;
  @Input() sinAsociar = 0;
  @Input() borradores = 0;
}
