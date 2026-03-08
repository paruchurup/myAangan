import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../../core/services/event.service';
import { AuthService } from '../../../core/services/auth.service';
import { EVENT_STATUS_CONFIG } from '../../../core/models/event.model';

declare const Razorpay: any;

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="page">
  <div class="header" *ngIf="detail">
    <button class="back-btn" (click)="router.navigate(['/events'])">←</button>
    <div class="header-main">
      <div class="event-title">{{ detail.event.name }}</div>
      <div class="status-pill"
        [style.background]="statusCfg[detail.event.status]?.bg"
        [style.color]="statusCfg[detail.event.status]?.color">
        {{ statusCfg[detail.event.status]?.icon }} {{ statusCfg[detail.event.status]?.label }}
      </div>
    </div>
  </div>

  <div class="loading" *ngIf="loading"><div class="spinner"></div></div>

  <div class="body" *ngIf="detail">
    <!-- Organiser action bar -->
    <div class="org-bar" *ngIf="canCreate">
      <button class="org-btn yellow" *ngIf="detail.event.status==='DRAFT'"     (click)="openVoting()">🗳️ Open Voting</button>
      <button class="org-btn green"  *ngIf="detail.event.status==='APPROVED'"  (click)="activate()">🎉 Activate Event</button>
      <button class="org-btn blue"   *ngIf="detail.event.status==='ACTIVE'"    (click)="complete()">🏆 Mark Complete</button>
      <button class="org-btn red"    *ngIf="['DRAFT','VOTING','APPROVED','ACTIVE'].includes(detail.event.status)" (click)="cancel()">✕ Cancel</button>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" [class.active]="tab==='INFO'"     (click)="tab='INFO'">📋 Info</button>
      <button class="tab" [class.active]="tab==='VOTE'"     (click)="tab='VOTE'"     *ngIf="isVoting">🗳️ Vote</button>
      <button class="tab" [class.active]="tab==='VOLUNTEER'" (click)="tab='VOLUNTEER'">🙋 Volunteer</button>
      <button class="tab" [class.active]="tab==='FUNDS'"    (click)="tab='FUNDS'">💰 Funds</button>
      <button class="tab" [class.active]="tab==='EXPENSES'" (click)="tab='EXPENSES'">🧾 Expenses</button>
      <button class="tab" [class.active]="tab==='GALLERY'"  (click)="tab='GALLERY'; loadPhotos()">📷 Gallery</button>
      <button class="tab" [class.active]="tab==='SETTLE'"   (click)="tab='SETTLE'"   *ngIf="detail.event.status==='COMPLETED'">🏁 Settlement</button>
    </div>

    <!-- ── INFO ─────────────────────────────────────────────────── -->
    <div class="tab-body" *ngIf="tab==='INFO'">
      <div class="info-grid">
        <div class="info-item"><div class="il">Date</div><div class="iv">{{ detail.event.eventDate | date:'d MMM yyyy, h:mm a' }}</div></div>
        <div class="info-item"><div class="il">Venue</div><div class="iv">{{ detail.event.venue || '—' }}</div></div>
        <div class="info-item"><div class="il">Est. Budget</div><div class="iv money">₹{{ detail.event.estimatedBudget | number:'1.0-0' }}</div></div>
        <div class="info-item"><div class="il">Organiser</div><div class="iv">{{ detail.event.createdBy?.firstName }} {{ detail.event.createdBy?.lastName }}</div></div>
        <div class="info-item"><div class="il">Quorum</div><div class="iv">{{ detail.event.quorumPct }}% of residents</div></div>
        <div class="info-item"><div class="il">Vote Deadline</div><div class="iv">{{ detail.event.voteDeadline | date:'d MMM, h:mm a' }}</div></div>
      </div>
      <div class="desc-box" *ngIf="detail.event.description">{{ detail.event.description }}</div>

      <!-- Funds summary bar -->
      <div class="funds-bar">
        <div class="fb-item green"><div class="fb-val">₹{{ detail.raised | number:'1.0-0' }}</div><div class="fb-label">Raised</div></div>
        <div class="fb-sep">of</div>
        <div class="fb-item"><div class="fb-val">₹{{ detail.event.estimatedBudget | number:'1.0-0' }}</div><div class="fb-label">Estimated</div></div>
        <div class="fb-sep">·</div>
        <div class="fb-item red"><div class="fb-val">₹{{ detail.spent | number:'1.0-0' }}</div><div class="fb-label">Spent</div></div>
      </div>
      <div class="progress-track">
        <div class="progress-fill" [style.width.%]="fundPct" [class.fill-green]="fundPct<=100" [class.fill-red]="fundPct>100"></div>
      </div>
      <div class="fund-pct-label">{{ fundPct }}% of budget raised</div>
    </div>

    <!-- ── VOTE ──────────────────────────────────────────────────── -->
    <div class="tab-body" *ngIf="tab==='VOTE'">
      <div class="vote-status">
        <div class="vs-row">
          <span class="vs-yes">✅ YES: {{ detail.yesVotes }}</span>
          <span class="vs-total">{{ detail.totalVotes }} votes cast</span>
          <span class="vs-no">❌ NO: {{ detail.noVotes }}</span>
        </div>
        <div class="vote-bar">
          <div class="vb-yes"  [style.width.%]="detail.totalVotes > 0 ? detail.yesVotes * 100 / detail.totalVotes : 0"></div>
          <div class="vb-no"   [style.width.%]="detail.totalVotes > 0 ? detail.noVotes * 100  / detail.totalVotes : 0"></div>
        </div>
        <div class="quorum-note">Need {{ detail.event.quorumPct }}% participation for quorum. Currently {{ quorumPct }}%.</div>
        <div class="deadline-note">Voting closes {{ detail.event.voteDeadline | date:'d MMM, h:mm a' }}</div>
      </div>

      <div class="already-voted" *ngIf="detail.hasVoted">
        You voted <strong>{{ detail.myVote }}</strong> on this event.
      </div>
      <div class="vote-buttons" *ngIf="!detail.hasVoted && detail.event.status==='VOTING'">
        <button class="yes-btn" (click)="vote('YES')" [disabled]="voting">👍 Approve Event</button>
        <button class="no-btn"  (click)="vote('NO')"  [disabled]="voting">👎 Reject Event</button>
      </div>
    </div>

    <!-- ── VOLUNTEER ──────────────────────────────────────────────── -->
    <div class="tab-body" *ngIf="tab==='VOLUNTEER'">
      <div class="empty-msg" *ngIf="!detail.volunteerSlots?.length">No volunteer roles defined for this event.</div>
      <div class="slot-card" *ngFor="let vs of detail.volunteerSlots">
        <div class="slot-top">
          <div class="slot-role">{{ vs.slot.roleName }}</div>
          <div class="slot-count" [class.full]="vs.isFull">{{ vs.signupCount }}/{{ vs.slot.maxVolunteers }} {{ vs.isFull ? '(Full)' : '' }}</div>
        </div>
        <div class="slot-desc" *ngIf="vs.slot.roleDescription">{{ vs.slot.roleDescription }}</div>
        <div class="slot-actions">
          <button class="signup-btn" *ngIf="!vs.isSignedUp && !vs.isFull && canVolunteer && isEventOpen"
            (click)="signup(vs.slot.id)">🙋 Sign Up</button>
          <button class="withdraw-btn" *ngIf="vs.isSignedUp"
            (click)="withdrawSignup(vs.slot.id)">↩ Withdraw</button>
          <span class="signed-tag" *ngIf="vs.isSignedUp">✅ You're signed up</span>
        </div>
      </div>
    </div>

    <!-- ── FUNDS ──────────────────────────────────────────────────── -->
    <div class="tab-body" *ngIf="tab==='FUNDS'">
      <!-- Contribute money -->
      <div class="contribute-card" *ngIf="canContribute && isEventOpen">
        <div class="cc-title">💳 Make a Contribution</div>
        <div class="cc-row">
          <input type="number" [(ngModel)]="contribAmount" placeholder="Amount (₹)" class="contrib-input" min="1" />
          <button class="contrib-btn" (click)="contribute()" [disabled]="contributing">
            {{ contributing ? 'Opening…' : 'Contribute' }}
          </button>
        </div>
      </div>

      <!-- In-kind -->
      <div class="contribute-card" *ngIf="canContribute && isEventOpen">
        <div class="cc-title">🎁 Log In-Kind Contribution</div>
        <input [(ngModel)]="inkind.itemName"    placeholder="Item name (e.g. Flowers, Sweets)" class="ik-input" />
        <input [(ngModel)]="inkind.description" placeholder="Description (optional)"           class="ik-input" />
        <div class="ik-row">
          <input type="number" [(ngModel)]="inkind.quantity"       placeholder="Qty" class="ik-qty" />
          <input type="number" [(ngModel)]="inkind.estimatedValue" placeholder="Est. value (₹)" class="ik-val" />
          <button class="ik-btn" (click)="logInKind()" [disabled]="loggingInKind">
            {{ loggingInKind ? 'Saving…' : '+ Log' }}
          </button>
        </div>
      </div>

      <!-- Contribution list -->
      <div class="list-title">💰 Cash Contributions ({{ detail.contributions?.length || 0 }})</div>
      <div class="contrib-row" *ngFor="let c of detail.contributions">
        <div class="cr-name">{{ c.resident?.firstName }} {{ c.resident?.lastName }} <span class="cr-flat">· {{ c.resident?.flatNumber }}</span></div>
        <div class="cr-amount" [class.pending]="!c.confirmed">₹{{ c.amount | number:'1.0-0' }} {{ !c.confirmed ? '(pending)' : '' }}</div>
      </div>
      <div class="empty-msg" *ngIf="!detail.contributions?.length">No cash contributions yet.</div>
    </div>

    <!-- ── EXPENSES ───────────────────────────────────────────────── -->
    <div class="tab-body" *ngIf="tab==='EXPENSES'">
      <!-- Log expense form -->
      <div class="expense-form" *ngIf="canExpense && (detail.event.status==='ACTIVE' || detail.event.status==='COMPLETED')">
        <div class="ef-title">🧾 Log Expense</div>
        <input [(ngModel)]="exp.description" placeholder="Description" class="exp-input" />
        <div class="exp-row">
          <input type="number" [(ngModel)]="exp.amount" placeholder="Amount (₹)" class="exp-amount" />
          <select [(ngModel)]="exp.category" class="exp-cat">
            <option value="Food">Food</option><option value="Decoration">Decoration</option>
            <option value="Music">Music</option><option value="Venue">Venue</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="exp-file-row">
          <label class="file-label" for="receipt">📷 Attach Receipt</label>
          <input type="file" id="receipt" (change)="onReceipt($event)" accept="image/*,application/pdf" class="file-inp" />
          <span class="file-name" *ngIf="receiptFile">{{ receiptFile.name }}</span>
        </div>
        <button class="exp-btn" (click)="logExpense()" [disabled]="loggingExp">
          {{ loggingExp ? 'Saving…' : '+ Log Expense' }}
        </button>
      </div>

      <!-- Expense list -->
      <div class="expense-row" *ngFor="let e of detail.expenses">
        <div class="er-left">
          <div class="er-desc">{{ e.description }}</div>
          <div class="er-meta">{{ e.category }} · {{ e.loggedBy?.firstName }} {{ e.loggedBy?.lastName }} · {{ e.createdAt | date:'d MMM, h:mm a' }}</div>
        </div>
        <div class="er-right">
          <div class="er-amount">₹{{ e.amount | number:'1.0-0' }}</div>
          <a class="receipt-link" *ngIf="e.receiptPath" [href]="svc.mediaUrl(e.receiptPath)" target="_blank">📄</a>
        </div>
      </div>
      <div class="empty-msg" *ngIf="!detail.expenses?.length">No expenses logged yet.</div>
    </div>

    <!-- ── GALLERY ─────────────────────────────────────────────────── -->
    <div class="tab-body" *ngIf="tab==='GALLERY'">
      <!-- Upload -->
      <div class="photo-upload" *ngIf="canPhoto && detail.event.status==='COMPLETED'">
        <input type="file" id="photo" (change)="onPhoto($event)" accept="image/*" class="file-inp" />
        <label for="photo" class="photo-upload-label">{{ photoFile ? photoFile.name : '📷 Choose Photo' }}</label>
        <input [(ngModel)]="photoCaption" placeholder="Caption (optional)" class="caption-input" />
        <button class="upload-btn" (click)="uploadPhoto()" [disabled]="uploadingPhoto">
          {{ uploadingPhoto ? 'Uploading…' : '⬆ Upload' }}
        </button>
      </div>

      <div class="photo-loading" *ngIf="photosLoading"><div class="spinner"></div></div>
      <div class="empty-msg" *ngIf="!photosLoading && !photos.length">No photos yet.</div>
      <div class="photo-grid">
        <div class="photo-item" *ngFor="let p of photos">
          <a [href]="svc.mediaUrl(p.photoPath)" target="_blank">
            <img [src]="svc.mediaUrl(p.photoPath)" [alt]="p.caption || 'Event photo'" />
          </a>
          <div class="photo-caption" *ngIf="p.caption">{{ p.caption }}</div>
          <div class="photo-by">{{ p.uploadedBy?.firstName }} · {{ p.uploadedAt | date:'d MMM' }}</div>
        </div>
      </div>
    </div>

    <!-- ── SETTLEMENT ─────────────────────────────────────────────── -->
    <div class="tab-body" *ngIf="tab==='SETTLE'">
      <div class="balance-sheet">
        <div class="bs-row header-row"><span>Item</span><span>Amount</span></div>
        <div class="bs-row green-row"><span>Total Contributions</span><span>₹{{ detail.raised | number:'1.2-2' }}</span></div>
        <div class="bs-row red-row"><span>Total Expenses</span><span>₹{{ detail.spent | number:'1.2-2' }}</span></div>
        <div class="bs-row total-row" [class.surplus]="detail.raised - detail.spent >= 0" [class.deficit]="detail.raised - detail.spent < 0">
          <span>{{ detail.raised - detail.spent >= 0 ? 'Surplus' : 'Deficit' }}</span>
          <span>₹{{ Math.abs(detail.raised - detail.spent) | number:'1.2-2' }}</span>
        </div>
      </div>

      <!-- Surplus vote -->
      <div class="surplus-section" *ngIf="detail.raised - detail.spent > 0">
        <div class="ss-title">What to do with the surplus?</div>
        <div class="surplus-results">
          <div class="sr-row"><span>🔄 Carry Forward</span><span class="sr-count">{{ detail.surplusResults?.CARRY_FORWARD || 0 }} votes</span></div>
          <div class="sr-row"><span>🤝 Donate</span><span class="sr-count">{{ detail.surplusResults?.DONATE || 0 }} votes</span></div>
          <div class="sr-row"><span>💸 Refund Proportionally</span><span class="sr-count">{{ detail.surplusResults?.REFUND || 0 }} votes</span></div>
        </div>
        <div class="surplus-voted" *ngIf="detail.hasSurplusVoted">✅ You have voted on surplus.</div>
        <div class="surplus-vote-btns" *ngIf="!detail.hasSurplusVoted">
          <button class="sv-btn" (click)="surplusVote('CARRY_FORWARD')" [disabled]="votingSurplus">🔄 Carry Forward</button>
          <button class="sv-btn" (click)="surplusVote('DONATE')"        [disabled]="votingSurplus">🤝 Donate</button>
          <button class="sv-btn" (click)="surplusVote('REFUND')"        [disabled]="votingSurplus">💸 Refund</button>
        </div>
      </div>

      <!-- Recognition wall -->
      <div class="recognition-wall" *ngIf="recognition.length || canCreate">
        <div class="rw-title">🌟 Recognition Wall — These People Made It Happen</div>
        <div class="recognition-list" *ngIf="recognition.length">
          <div class="rec-card" *ngFor="let r of recognition">
            <div class="rec-name">{{ r.name }}</div>
            <div class="rec-role">{{ r.role }}</div>
            <div class="rec-note" *ngIf="r.note">{{ r.note }}</div>
          </div>
        </div>
        <!-- Organiser editor -->
        <div class="rec-editor" *ngIf="canCreate && editingRec">
          <textarea [(ngModel)]="recognitionRaw" rows="6" class="rec-textarea"
            placeholder='[{"name":"Arun Kumar","role":"Decoration","note":"Transformed the hall!"},...]'></textarea>
          <div class="rec-actions">
            <button class="rec-save-btn" (click)="saveRecognition()">Save</button>
            <button class="rec-cancel-btn" (click)="editingRec=false">Cancel</button>
          </div>
        </div>
        <button class="edit-rec-btn" *ngIf="canCreate && !editingRec" (click)="startEditRec()">✏️ Edit Recognition</button>
      </div>
    </div>
  </div><!-- /body -->

  <div class="err" *ngIf="error">{{ error }}</div>
  <div class="ok"  *ngIf="okMsg">{{ okMsg }}</div>
</div>`,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;600&display=swap');
    .page{min-height:100vh;background:#1c1c1c;padding-bottom:80px;font-family:'IBM Plex Sans',sans-serif;color:#e8e8e8;position:relative}
    .header{background:linear-gradient(180deg,#111 0%,#161616 100%);border-bottom:3px solid #f59e0b;padding:12px 14px;display:flex;align-items:center;gap:10px}
    .back-btn{background:none;border:1px solid #333;color:#9ca3af;padding:6px 10px;border-radius:6px;font-size:12px;cursor:pointer;flex-shrink:0}
    .header-main{flex:1;display:flex;justify-content:space-between;align-items:center;gap:8px}
    .event-title{font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:#fff;letter-spacing:0.5px}
    .status-pill{font-size:10px;font-family:'Oswald',sans-serif;padding:3px 8px;border-radius:10px;font-weight:700;white-space:nowrap}

    .org-bar{display:flex;gap:8px;padding:8px 14px;background:#111;border-bottom:1px solid #2a2a2a;flex-wrap:wrap}
    .org-btn{border:none;padding:7px 12px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;cursor:pointer;letter-spacing:0.5px}
    .org-btn.yellow{background:#f59e0b;color:#111}.org-btn.green{background:#10b981;color:#111}
    .org-btn.blue{background:#6366f1;color:#fff}.org-btn.red{background:none;border:1px solid #ef4444;color:#ef4444}

    .tabs{display:flex;background:#111;border-bottom:1px solid #2a2a2a;overflow-x:auto}
    .tab{flex:1;background:none;border:none;color:#6b7280;padding:10px 4px;font-size:10px;font-family:'Oswald',sans-serif;letter-spacing:0.3px;cursor:pointer;white-space:nowrap;border-bottom:2px solid transparent;transition:all 0.15s;min-width:50px}
    .tab.active{color:#f59e0b;border-bottom-color:#f59e0b}

    .body{padding:0}.tab-body{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
    .loading{display:flex;justify-content:center;padding:40px}
    .spinner{width:26px;height:26px;border:3px solid #333;border-top-color:#f59e0b;border-radius:50%;animation:spin 0.8s linear infinite}
    @keyframes spin{to{transform:rotate(360deg)}}
    .empty-msg{font-size:12px;color:#4b5563;text-align:center;padding:20px}
    .err{position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(100% - 28px);max-width:480px;background:rgba(239,68,68,0.9);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;text-align:center;z-index:50}
    .ok {position:fixed;bottom:80px;left:50%;transform:translateX(-50%);width:calc(100% - 28px);max-width:480px;background:rgba(16,185,129,0.9);color:#fff;padding:10px 14px;border-radius:8px;font-size:12px;text-align:center;z-index:50}

    /* INFO tab */
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .info-item{background:#252525;border:1px solid #333;border-radius:8px;padding:10px 12px}
    .il{font-size:10px;color:#6b7280;letter-spacing:1px;font-family:'Oswald',sans-serif;margin-bottom:2px}
    .iv{font-size:13px;color:#e8e8e8}.iv.money{color:#f59e0b;font-family:'IBM Plex Mono',monospace;font-weight:600}
    .desc-box{background:#252525;border:1px solid #333;border-radius:8px;padding:12px;font-size:13px;color:#9ca3af;line-height:1.6}
    .funds-bar{display:flex;align-items:center;gap:8px;background:#252525;border:1px solid #333;border-radius:8px;padding:12px 14px}
    .fb-item{display:flex;flex-direction:column;align-items:center;gap:2px}
    .fb-val{font-family:'IBM Plex Mono',monospace;font-size:15px;font-weight:700;color:#e8e8e8}
    .fb-item.green .fb-val{color:#10b981}.fb-item.red .fb-val{color:#ef4444}
    .fb-label{font-size:10px;color:#6b7280}.fb-sep{color:#4b5563;font-size:16px;flex:1;text-align:center}
    .progress-track{background:#333;border-radius:4px;height:7px;overflow:hidden}
    .progress-fill{height:100%;border-radius:4px;transition:width 0.5s ease}
    .fill-green{background:#10b981}.fill-red{background:#ef4444}
    .fund-pct-label{font-size:11px;color:#6b7280;text-align:right}

    /* VOTE tab */
    .vote-status{background:#252525;border:1px solid #333;border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px}
    .vs-row{display:flex;justify-content:space-between;align-items:center}
    .vs-yes{color:#10b981;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700}
    .vs-no{color:#ef4444;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700}
    .vs-total{font-size:11px;color:#6b7280}
    .vote-bar{background:#1c1c1c;border-radius:4px;height:8px;display:flex;overflow:hidden}
    .vb-yes{background:#10b981;transition:width 0.4s}.vb-no{background:#ef4444;transition:width 0.4s}
    .quorum-note,.deadline-note{font-size:11px;color:#6b7280}
    .already-voted{background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);color:#a5b4fc;padding:12px;border-radius:8px;font-size:13px;text-align:center}
    .vote-buttons{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .yes-btn{background:#10b981;border:none;color:#111;padding:14px;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;cursor:pointer}
    .no-btn{background:none;border:2px solid #ef4444;color:#ef4444;padding:14px;border-radius:8px;font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;cursor:pointer}
    .yes-btn:disabled,.no-btn:disabled{opacity:0.4}

    /* VOLUNTEER tab */
    .slot-card{background:#252525;border:1px solid #333;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
    .slot-top{display:flex;justify-content:space-between;align-items:center}
    .slot-role{font-family:'Oswald',sans-serif;font-size:15px;color:#fff;font-weight:700}
    .slot-count{font-size:11px;color:#6b7280;font-family:'IBM Plex Mono',monospace}.slot-count.full{color:#ef4444}
    .slot-desc{font-size:12px;color:#9ca3af}
    .slot-actions{display:flex;gap:8px;align-items:center}
    .signup-btn{background:#f59e0b;border:none;color:#111;padding:8px 14px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer}
    .withdraw-btn{background:none;border:1px solid #333;color:#6b7280;padding:8px 12px;border-radius:6px;font-size:12px;cursor:pointer;font-family:'Oswald',sans-serif}
    .signed-tag{font-size:11px;color:#10b981}

    /* FUNDS tab */
    .contribute-card{background:#252525;border:1px solid #333;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
    .cc-title{font-family:'Oswald',sans-serif;font-size:13px;color:#f59e0b;font-weight:700}
    .cc-row{display:flex;gap:8px}
    .contrib-input{flex:1;background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:9px;font-size:14px;font-family:'IBM Plex Mono',monospace;outline:none}
    .contrib-btn{background:#f59e0b;border:none;color:#111;padding:9px 16px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
    .ik-input{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px 10px;font-size:13px;outline:none;width:100%;box-sizing:border-box}
    .ik-row{display:flex;gap:8px}
    .ik-qty{width:60px;background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px;font-size:13px;outline:none;text-align:center}
    .ik-val{flex:1;background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px;font-size:13px;outline:none}
    .ik-btn{background:#10b981;border:none;color:#111;padding:8px 12px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:11px;font-weight:700;cursor:pointer;white-space:nowrap}
    .list-title{font-family:'Oswald',sans-serif;font-size:11px;color:#6b7280;letter-spacing:1px}
    .contrib-row{background:#252525;border:1px solid #333;border-radius:8px;padding:9px 12px;display:flex;justify-content:space-between;align-items:center}
    .cr-name{font-size:13px;color:#e8e8e8}.cr-flat{font-size:11px;color:#6b7280}
    .cr-amount{font-family:'IBM Plex Mono',monospace;font-size:13px;color:#10b981;font-weight:600}
    .cr-amount.pending{color:#f59e0b}

    /* EXPENSES tab */
    .expense-form{background:#252525;border:1px solid #333;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:8px}
    .ef-title{font-family:'Oswald',sans-serif;font-size:13px;color:#6366f1;font-weight:700}
    .exp-input{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px 10px;font-size:13px;outline:none;width:100%;box-sizing:border-box}
    .exp-row{display:flex;gap:8px}
    .exp-amount{width:120px;background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px;font-size:13px;outline:none;font-family:'IBM Plex Mono',monospace}
    .exp-cat{flex:1;background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px;font-size:13px;outline:none}
    .exp-file-row{display:flex;align-items:center;gap:8px}
    .file-label{font-size:12px;color:#6b7280;background:#1c1c1c;border:1px dashed #333;padding:6px 12px;border-radius:6px;cursor:pointer}
    .file-inp{display:none}
    .file-name{font-size:11px;color:#9ca3af;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}
    .exp-btn{background:#6366f1;border:none;color:#fff;padding:9px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer}
    .expense-row{background:#252525;border:1px solid #333;border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center;gap:8px}
    .er-left{flex:1}.er-desc{font-size:13px;color:#e8e8e8;font-weight:500}.er-meta{font-size:11px;color:#4b5563;margin-top:2px}
    .er-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px}
    .er-amount{font-family:'IBM Plex Mono',monospace;font-size:14px;font-weight:700;color:#ef4444}
    .receipt-link{font-size:18px;text-decoration:none}

    /* GALLERY tab */
    .photo-upload{background:#252525;border:1px solid #333;border-radius:10px;padding:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
    .photo-upload-label{background:#1c1c1c;border:1px dashed #333;color:#9ca3af;padding:8px 14px;border-radius:6px;font-size:12px;cursor:pointer}
    .caption-input{flex:1;min-width:120px;background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:8px;font-size:12px;outline:none}
    .upload-btn{background:#f59e0b;border:none;color:#111;padding:8px 14px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap}
    .photo-loading{display:flex;justify-content:center;padding:20px}
    .photo-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
    .photo-item{background:#252525;border:1px solid #333;border-radius:8px;overflow:hidden}
    .photo-item img{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}
    .photo-caption{font-size:11px;color:#9ca3af;padding:4px 8px}
    .photo-by{font-size:10px;color:#4b5563;padding:0 8px 6px}

    /* SETTLEMENT tab */
    .balance-sheet{background:#252525;border:1px solid #333;border-radius:10px;overflow:hidden}
    .bs-row{display:flex;justify-content:space-between;padding:10px 14px;font-size:13px;border-bottom:1px solid #1c1c1c}
    .bs-row.header-row{font-family:'Oswald',sans-serif;font-size:10px;color:#6b7280;letter-spacing:1px;padding:8px 14px}
    .bs-row.green-row{color:#10b981}.bs-row.red-row{color:#ef4444}
    .bs-row.total-row{font-family:'Oswald',sans-serif;font-size:14px;font-weight:700;background:#1c1c1c;border-bottom:none}
    .bs-row.total-row.surplus{color:#10b981}.bs-row.total-row.deficit{color:#ef4444}
    .surplus-section{background:#252525;border:1px solid #333;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
    .ss-title{font-family:'Oswald',sans-serif;font-size:13px;color:#f59e0b;font-weight:700}
    .surplus-results{display:flex;flex-direction:column;gap:6px}
    .sr-row{display:flex;justify-content:space-between;font-size:13px;color:#e8e8e8}
    .sr-count{font-family:'IBM Plex Mono',monospace;font-size:12px;color:#6b7280}
    .surplus-voted{font-size:12px;color:#10b981;text-align:center}
    .surplus-vote-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
    .sv-btn{background:#1c1c1c;border:1px solid #333;color:#e8e8e8;padding:9px 4px;border-radius:7px;font-size:11px;font-family:'Oswald',sans-serif;cursor:pointer;text-align:center}
    .sv-btn:hover{border-color:#f59e0b;color:#f59e0b}.sv-btn:disabled{opacity:0.4}
    .recognition-wall{background:#252525;border:1px solid #333;border-radius:10px;padding:12px 14px;display:flex;flex-direction:column;gap:10px}
    .rw-title{font-family:'Oswald',sans-serif;font-size:13px;color:#f59e0b;font-weight:700}
    .recognition-list{display:flex;flex-direction:column;gap:8px}
    .rec-card{background:#1c1c1c;border-radius:8px;padding:10px 12px;border-left:3px solid #f59e0b}
    .rec-name{font-family:'Oswald',sans-serif;font-size:15px;color:#fff;font-weight:700}
    .rec-role{font-size:11px;color:#f59e0b;letter-spacing:0.5px}
    .rec-note{font-size:12px;color:#9ca3af;margin-top:4px;line-height:1.5}
    .rec-textarea{background:#1c1c1c;border:1.5px solid #333;border-radius:6px;color:#e8e8e8;padding:9px;font-size:12px;font-family:'IBM Plex Mono',monospace;width:100%;box-sizing:border-box;resize:vertical;outline:none}
    .rec-actions{display:flex;gap:8px}
    .rec-save-btn{background:#f59e0b;border:none;color:#111;padding:8px 14px;border-radius:6px;font-family:'Oswald',sans-serif;font-size:12px;font-weight:700;cursor:pointer}
    .rec-cancel-btn{background:none;border:1px solid #333;color:#6b7280;padding:8px 12px;border-radius:6px;font-size:12px;cursor:pointer}
    .edit-rec-btn{background:none;border:1px dashed #333;color:#6b7280;padding:8px;border-radius:6px;font-size:12px;cursor:pointer;text-align:center}
  `]
})
export class EventDetailComponent implements OnInit {
  detail:   any    = null;
  photos:   any[]  = [];
  loading         = true;
  photosLoading   = false;
  voting          = false;
  contributing    = false;
  loggingInKind   = false;
  loggingExp      = false;
  uploadingPhoto  = false;
  votingSurplus   = false;
  editingRec      = false;

  tab = 'INFO';
  error = '';
  okMsg = '';

  contribAmount = '';
  inkind  = { itemName: '', description: '', quantity: 1, estimatedValue: '' };
  exp     = { description: '', amount: '', category: 'Other' };
  receiptFile:  File | null = null;
  photoFile:    File | null = null;
  photoCaption = '';
  recognitionRaw = '';

  canCreate    = false;
  canVolunteer = false;
  canContribute= false;
  canExpense   = false;
  canPhoto     = false;

  Math = Math;
  statusCfg = EVENT_STATUS_CONFIG as Record<string, { label: string; color: string; bg: string; icon: string }>;

  constructor(
    private route: ActivatedRoute,
    public  router: Router,
    public  svc: EventService,
    private auth: AuthService
  ) {}

  ngOnInit() {
    this.canCreate    = this.auth.can('EVENT_CREATE');
    this.canVolunteer = this.auth.can('EVENT_VOLUNTEER');
    this.canContribute= this.auth.can('EVENT_CONTRIBUTE');
    this.canExpense   = this.auth.can('EVENT_EXPENSE');
    this.canPhoto     = this.auth.can('EVENT_PHOTO');

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDetail(id);
  }

  loadDetail(id: number) {
    this.loading = true;
    this.svc.getEventDetail(id).subscribe({
      next: r => { this.detail = r.data; this.loading = false; this.parseRecognition(); },
      error: e => { this.loading = false; this.flash(e.error?.message || 'Failed to load event details', false); }
    });
  }

  get id() { return this.detail?.event?.id; }
  get isVoting()   { return this.detail?.event?.status === 'VOTING'; }
  get isEventOpen(){ return ['APPROVED','ACTIVE'].includes(this.detail?.event?.status); }
  get fundPct()    { return this.detail ? Math.min(200, Math.round((this.detail.raised / this.detail.event.estimatedBudget) * 100)) : 0; }
  get quorumPct()  { return this.detail && this.detail.totalVotes > 0
    ? Math.round(this.detail.totalVotes * 100 / Math.max(1, this.detail.totalVotes)) : 0; }

  recognition: any[] = [];
  parseRecognition() {
    try { this.recognition = this.detail?.event?.recognitionJson ? JSON.parse(this.detail.event.recognitionJson) : []; }
    catch { this.recognition = []; }
  }

  flash(msg: string, ok = true) {
    if (ok) { this.okMsg = msg; setTimeout(() => this.okMsg = '', 3000); }
    else     { this.error = msg; setTimeout(() => this.error = '', 4000); }
  }

  // Organiser actions
  openVoting() { this.svc.openVoting(this.id).subscribe({ next: () => this.loadDetail(this.id), error: e => this.flash(e.error?.message, false) }); }
  activate()   { this.svc.activateEvent(this.id).subscribe({ next: () => this.loadDetail(this.id), error: e => this.flash(e.error?.message, false) }); }
  complete()   { this.svc.completeEvent(this.id).subscribe({ next: () => { this.loadDetail(this.id); this.tab = 'SETTLE'; }, error: e => this.flash(e.error?.message, false) }); }
  cancel()     { if (!confirm('Cancel this event?')) return; this.svc.cancelEvent(this.id).subscribe({ next: () => this.loadDetail(this.id), error: e => this.flash(e.error?.message, false) }); }

  vote(choice: string) {
    this.voting = true;
    this.svc.castVote(this.id, choice).subscribe({
      next: () => { this.flash('Vote cast!'); this.loadDetail(this.id); this.voting = false; },
      error: e => { this.flash(e.error?.message || 'Vote failed', false); this.voting = false; }
    });
  }

  signup(slotId: number) {
    this.svc.signUp(slotId).subscribe({
      next: () => { this.flash('Signed up!'); this.loadDetail(this.id); },
      error: e => this.flash(e.error?.message, false)
    });
  }

  withdrawSignup(slotId: number) {
    this.svc.withdraw(slotId).subscribe({
      next: () => { this.flash('Withdrawn.'); this.loadDetail(this.id); },
      error: e => this.flash(e.error?.message, false)
    });
  }

  contribute() {
    if (!this.contribAmount || +this.contribAmount <= 0) { this.flash('Enter a valid amount', false); return; }
    if (typeof Razorpay === 'undefined') { this.flash('Payment gateway not loaded', false); return; }
    this.contributing = true;
    this.svc.createContributionOrder(this.id, +this.contribAmount).subscribe({
      next: r => {
        const o = r.data;
        const rzp = new Razorpay({
          key: o.keyId, amount: o.amount, currency: o.currency,
          name: o.eventName, description: 'Event Contribution',
          order_id: o.orderId, theme: { color: '#f59e0b' },
          handler: () => { this.flash('Contribution recorded! Thank you 🙏'); this.contribAmount = ''; this.loadDetail(this.id); },
          modal: { ondismiss: () => {} }
        });
        rzp.open();
        this.contributing = false;
      },
      error: e => { this.flash(e.error?.message || 'Failed', false); this.contributing = false; }
    });
  }

  logInKind() {
    if (!this.inkind.itemName) { this.flash('Enter item name', false); return; }
    this.loggingInKind = true;
    this.svc.logInKind(this.id, this.inkind).subscribe({
      next: () => { this.flash('In-kind contribution logged!'); this.inkind = { itemName: '', description: '', quantity: 1, estimatedValue: '' }; this.loadDetail(this.id); this.loggingInKind = false; },
      error: e => { this.flash(e.error?.message, false); this.loggingInKind = false; }
    });
  }

  onReceipt(e: any) { this.receiptFile = e.target.files[0] || null; }
  onPhoto(e: any)   { this.photoFile   = e.target.files[0] || null; }

  logExpense() {
    if (!this.exp.description || !this.exp.amount) { this.flash('Fill description and amount', false); return; }
    this.loggingExp = true;
    const fd = new FormData();
    fd.append('description', this.exp.description);
    fd.append('amount', this.exp.amount);
    fd.append('category', this.exp.category);
    if (this.receiptFile) fd.append('receipt', this.receiptFile);
    this.svc.logExpense(this.id, fd).subscribe({
      next: () => { this.flash('Expense logged!'); this.exp = { description: '', amount: '', category: 'Other' }; this.receiptFile = null; this.loadDetail(this.id); this.loggingExp = false; },
      error: e => { this.flash(e.error?.message, false); this.loggingExp = false; }
    });
  }

  loadPhotos() {
    this.photosLoading = true;
    this.svc.getPhotos(this.id).subscribe({
      next: r => { this.photos = r.data; this.photosLoading = false; },
      error: () => this.photosLoading = false
    });
  }

  uploadPhoto() {
    if (!this.photoFile) { this.flash('Choose a photo first', false); return; }
    this.uploadingPhoto = true;
    const fd = new FormData();
    fd.append('photo', this.photoFile);
    if (this.photoCaption) fd.append('caption', this.photoCaption);
    this.svc.uploadPhoto(this.id, fd).subscribe({
      next: () => { this.flash('Photo uploaded!'); this.photoFile = null; this.photoCaption = ''; this.loadPhotos(); this.uploadingPhoto = false; },
      error: e => { this.flash(e.error?.message, false); this.uploadingPhoto = false; }
    });
  }

  surplusVote(choice: string) {
    this.votingSurplus = true;
    this.svc.castSurplusVote(this.id, choice).subscribe({
      next: () => { this.flash('Surplus vote cast!'); this.loadDetail(this.id); this.votingSurplus = false; },
      error: e => { this.flash(e.error?.message, false); this.votingSurplus = false; }
    });
  }

  startEditRec() {
    this.recognitionRaw = this.detail?.event?.recognitionJson || '[]';
    this.editingRec = true;
  }

  saveRecognition() {
    this.svc.saveRecognition(this.id, this.recognitionRaw).subscribe({
      next: () => { this.flash('Recognition saved!'); this.editingRec = false; this.loadDetail(this.id); },
      error: e => this.flash(e.error?.message, false)
    });
  }
}
