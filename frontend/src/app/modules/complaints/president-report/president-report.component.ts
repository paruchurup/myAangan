import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '@services/complaint.service';
import { Complaint, STATUS_CONFIG } from '@models/complaint.model';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-president-report',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: "./president-report.component.html",
  styleUrls: ["./president-report.component.scss"]
})
export class PresidentReportComponent implements OnInit {
  complaints: Complaint[] = [];
  stats: Record<string, number> = {};
  loading = true;
  downloading = false;
  dlError = '';
  activeFilter = 'ALL';

  pdfForm = {
    reportTitle: '',
    societyName: '',
    addressedTo: 'The BDA Engineer, Bengaluru Development Authority',
    coveringLetter: '',
    includeResolved: false,
    includeClosed: false
  };

  statItems = [
    {key:'OPEN',label:'Open'},{key:'IN_PROGRESS',label:'In Progress'},
    {key:'ESCALATED_TO_BDA',label:'At BDA'},{key:'RESOLVED',label:'Resolved'},
    {key:'ESCALATED_TO_BM',label:'At BM'},{key:'REJECTED',label:'Rejected'},
  ];

  filters = [
    {label:'All',value:'ALL'},{label:'🔴 Open',value:'OPEN'},
    {label:'🔵 In Progress',value:'IN_PROGRESS'},{label:'🚨 Escalated',value:'ESCALATED'},
    {label:'⏰ Overdue',value:'BREACHED'},{label:'🟢 Resolved',value:'RESOLVED'},
  ];

  get filtered(){
    if(this.activeFilter==='ALL') return this.complaints;
    if(this.activeFilter==='BREACHED') return this.complaints.filter(c=>c.slaBreached);
    if(this.activeFilter==='ESCALATED') return this.complaints.filter(c=>c.escalationLevel!=='FACILITY_MANAGER');
    return this.complaints.filter(c=>c.status===this.activeFilter);
  }

  constructor(private svc: ComplaintService, private auth: AuthService){}

  ngOnInit(){
    this.svc.getAll().subscribe({next:r=>{this.complaints=r.data;this.loading=false;}});
    this.svc.getStats().subscribe({next:r=>{this.stats=r.data;}});
    const u = this.auth.getCurrentUser();
    if(u) this.pdfForm.societyName = u.societyName||'';
  }

  setFilter(f: string){this.activeFilter=f;}

  downloadPdf(){
    this.downloading=true; this.dlError='';
    this.svc.downloadPdf(this.pdfForm).subscribe({
      next:(blob)=>{
        this.downloading=false;
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');
        a.href=url;
        a.download=`MyAangan_Complaints_${new Date().toISOString().slice(0,10)}.pdf`;
        a.click(); URL.revokeObjectURL(url);
      },
      error:err=>{this.downloading=false;this.dlError='Failed to generate PDF. Please try again.';}
    });
  }

  sb(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  sc(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
}
