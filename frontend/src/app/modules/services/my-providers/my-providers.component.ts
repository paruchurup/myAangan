import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ServiceDirectoryService } from '@services/service-directory.service';
import { ProviderSummary } from '@models/service.model';

@Component({
  selector: 'app-my-providers',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./my-providers.component.html",
  styleUrls: ["./my-providers.component.scss"]
})
export class MyProvidersComponent implements OnInit {
  providers: ProviderSummary[] = [];
  loading = true;

  constructor(private svc: ServiceDirectoryService) {}

  ngOnInit() {
    this.svc.getMyProviders().subscribe({
      next: r => { this.providers = r.data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  getStars(avg: number) {
    const f = Math.round(avg);
    return '★'.repeat(f) + '☆'.repeat(5 - f);
  }

  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
