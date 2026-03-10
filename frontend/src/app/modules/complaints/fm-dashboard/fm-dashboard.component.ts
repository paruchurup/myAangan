import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '@services/complaint.service';
import { Complaint, ComplaintStatus, STATUS_CONFIG } from '@models/complaint.model';

@Component({
  selector: 'app-fm-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./fm-dashboard.component.html",
  styleUrls: ["./fm-dashboard.component.scss"]
})
export class FmDashboardComponent implements OnInit {
  complaints: Complaint[] = [];
  stats: Record<string, number> = {};
  loading = true;
  activeFilter: string = 'ALL';

  statCards = [
    {key:'OPEN',label:'Open',bg:'rgba(254,226,226,0.8)',color:'#991b1b'},
    {key:'IN_PROGRESS',label:'In Progress',bg:'rgba(219,234,254,0.8)',color:'#1e40af'},
    {key:'ESCALATED_TO_BM',label:'Escalated',bg:'rgba(254,243,199,0.8)',color:'#92400e'},
  ];

  filters = [
    {label:'All',value:'ALL'},
    {label:'🔴 Open',value:'OPEN'},
    {label:'🟡 Acknowledged',value:'ACKNOWLEDGED'},
    {label:'🔵 In Progress',value:'IN_PROGRESS'},
    {label:'🚨 Overdue',value:'BREACHED'},
    {label:'🟢 Resolved',value:'RESOLVED'},
    {label:'❌ Rejected',value:'REJECTED'},
  ];

  get filtered(){
    if(this.activeFilter==='ALL') return this.complaints;
    if(this.activeFilter==='BREACHED') return this.complaints.filter(c=>c.slaBreached);
    return this.complaints.filter(c=>c.status===this.activeFilter);
  }

  constructor(private svc: ComplaintService){}

  ngOnInit(){
    this.svc.getAll().subscribe({next:r=>{this.complaints=r.data;this.loading=false;}});
    this.svc.getStats().subscribe({next:r=>{this.stats=r.data;}});
  }

  setFilter(f: string){this.activeFilter=f;}
  sb(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  sc(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
}
