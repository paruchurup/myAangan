import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ComplaintService } from '@services/complaint.service';
import { Complaint, STATUS_CONFIG } from '@models/complaint.model';

@Component({
  selector: 'app-my-complaints',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './my-complaints.component.html',
  styleUrls: ['./my-complaints.component.scss']
})
export class MyComplaintsComponent implements OnInit {
  complaints: Complaint[] = [];
  loading = true;

  constructor(private svc: ComplaintService) {}
  ngOnInit(){this.svc.getMyComplaints().subscribe({next:r=>{this.complaints=r.data;this.loading=false;},error:()=>this.loading=false});}
  statusBg(s: string){return (STATUS_CONFIG as any)[s]?.bg||'#f3f4f6';}
  statusColor(s: string){return (STATUS_CONFIG as any)[s]?.color||'#555';}
}
