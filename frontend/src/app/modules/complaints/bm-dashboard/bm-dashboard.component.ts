import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ComplaintService } from '@services/complaint.service';
import { Complaint, STATUS_CONFIG, EscalationLevel } from '@models/complaint.model';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-bm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: "./bm-dashboard.component.html",
  styleUrls: ["./bm-dashboard.component.scss"]
})
export class BmDashboardComponent implements OnInit {
  complaints: Complaint[] = [];
  loading = true;
  isBda = false;
  get breachedCount(){return this.complaints.filter(c=>c.slaBreached).length;}
  constructor(private svc: ComplaintService, private auth: AuthService){}
  ngOnInit(){
    this.isBda = this.auth.getCurrentUser()?.role === 'BDA_ENGINEER';
    const level: EscalationLevel = this.isBda ? 'BDA_ENGINEER' : 'BUILDER_MANAGER';
    this.svc.getEscalated(level).subscribe({next:r=>{this.complaints=r.data;this.loading=false;},error:()=>this.loading=false});
  }
  sb(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  sc(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
}
