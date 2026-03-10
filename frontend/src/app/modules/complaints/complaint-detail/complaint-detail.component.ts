import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '@services/complaint.service';
import { Complaint, STATUS_CONFIG, ComplaintStatus } from '@models/complaint.model';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 'app-complaint-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  templateUrl: './complaint-detail.component.html',
  styleUrls: ['./complaint-detail.component.scss']
})
export class ComplaintDetailComponent implements OnInit {
  c: Complaint | null = null;
  loading = true;
  newComment = ''; isInternal = false;
  showResolve = false; showReject = false;
  resolutionNote = ''; rejectionReason = '';
  isFmOrAbove = false;

  constructor(private route: ActivatedRoute, private svc: ComplaintService, private auth: AuthService) {}

  ngOnInit() {
    const role = this.auth.getCurrentUser()?.role;
    this.isFmOrAbove = ['FACILITY_MANAGER','BUILDER_MANAGER','BDA_ENGINEER','ADMIN','PRESIDENT','SECRETARY','VOLUNTEER'].includes(role||'');
    this.load();
  }

  load() {
    const id = +this.route.snapshot.paramMap.get('id')!;
    this.svc.getById(id).subscribe({next:r=>{this.c=r.data;this.loading=false;},error:()=>this.loading=false});
  }

  sb(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  sc(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
  attIcon(t: string){return t==='PDF'?'📄':t==='VIDEO'?'🎥':'📎';}
  formatSize(b: number){if(!b)return '';if(b<1024*1024)return (b/1024).toFixed(0)+'KB';return (b/1024/1024).toFixed(1)+'MB';}

  assign(){this.svc.assign(this.c!.id).subscribe({next:r=>{this.c=r.data;}});}
  setStatus(s: ComplaintStatus){this.svc.updateStatus(this.c!.id,{status:s}).subscribe({next:r=>{this.c=r.data;}});}
  openResolve(){this.showResolve=true;this.showReject=false;}
  openReject(){this.showReject=true;this.showResolve=false;}
  confirmResolve(){this.svc.updateStatus(this.c!.id,{status:'RESOLVED',resolutionNote:this.resolutionNote}).subscribe({next:r=>{this.c=r.data;this.showResolve=false;}});}
  confirmReject(){if(!this.rejectionReason.trim())return;this.svc.updateStatus(this.c!.id,{status:'REJECTED',rejectionReason:this.rejectionReason}).subscribe({next:r=>{this.c=r.data;this.showReject=false;}});}
  doEscalate(){if(confirm('Escalate this complaint to the next level?'))this.svc.escalate(this.c!.id).subscribe({next:r=>{this.c=r.data;}});}
  addComment(){if(!this.newComment.trim())return;this.svc.addComment(this.c!.id,this.newComment,this.isInternal).subscribe({next:()=>{this.newComment='';this.load();}});}
}
