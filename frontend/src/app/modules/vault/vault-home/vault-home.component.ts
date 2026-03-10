import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { VaultService } from '@services/vault.service';
import { AuthService } from '@services/auth.service';
import { DOC_TYPE_CONFIG, FORMAT_ICONS } from '@models/vault.model';

@Component({
  selector: 'app-vault-home',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './vault-home.component.html',
  styleUrls: ['./vault-home.component.scss']
})
export class VaultHomeComponent implements OnInit {
  vault:    any    = null;
  loading         = false;
  tab             = 'SOCIETY';
  canUpload       = false;
  submittingNoc   = false;
  nocError        = '';
  okMsg           = '';
  noc = { purpose: '', details: '' };

  docTypeCfg = DOC_TYPE_CONFIG;

  constructor(public svc: VaultService, private auth: AuthService) {}

  ngOnInit() {
    this.canUpload = this.auth.can('VAULT_UPLOAD');
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.getMyVault().subscribe({
      next: r => { this.vault = r.data; this.loading = false; },
      error: () => this.loading = false
    });
  }

  fmtIcon(fmt: string): string {
    return FORMAT_ICONS[fmt] || '📄';
  }

  isExpired(date: string): boolean {
    return date ? new Date(date) < new Date() : false;
  }

  isExpiringSoon(date: string): boolean {
    if (!date) return false;
    const exp = new Date(date);
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    return exp >= new Date() && exp <= soon;
  }

  nocStatusLabel(s: string): string {
    return s === 'PENDING' ? '⏳ Pending' : s === 'FULFILLED' ? '✅ Fulfilled' : '❌ Rejected';
  }

  submitNoc() {
    if (!this.noc.purpose.trim()) { this.nocError = 'Purpose is required.'; return; }
    this.submittingNoc = true; this.nocError = '';
    this.svc.requestNoc(this.noc).subscribe({
      next: () => {
        this.okMsg = 'NOC request submitted!';
        setTimeout(() => this.okMsg = '', 3000);
        this.noc = { purpose: '', details: '' };
        this.load();
        this.tab = 'NOC_REQ';
        this.submittingNoc = false;
      },
      error: e => { this.nocError = e.error?.message || 'Failed.'; this.submittingNoc = false; }
    });
  }
}

